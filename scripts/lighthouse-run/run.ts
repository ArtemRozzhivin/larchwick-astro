import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = resolve(import.meta.dirname, '../..')
// Pinned so every run in a session, and any re-run, uses the same Lighthouse.
const LIGHTHOUSE = 'lighthouse@13.5.0'
const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
const ASTRO_HOST = 'larchwick-astro.local'
// Both sites are plain http (PLAN.md §10). Brave would upgrade them to https and stop on its
// warning page; the manual protocol avoided that by turning Shields off.
const NO_HTTPS_UPGRADE =
  '--disable-features=HttpsUpgrades,BraveHttpsByDefault,HttpsFirstBalancedModeAutoEnable,HttpsFirstModeV2ForEngagedSites'

const PAGES = {
  home: '/',
  about: '/about/',
  services: '/services/',
  products: '/products/',
  faq: '/faq/',
  contact: '/contact/',
  blog: '/blog/',
  'post-pour-over': '/how-to-brew-pour-over-at-home/',
  'post-ethiopia': '/ethiopia-yirgacheffe/',
} as const
const RUNS: Record<keyof typeof PAGES, number> = {
  home: 5,
  about: 3,
  services: 3,
  products: 3,
  faq: 3,
  contact: 3,
  blog: 3,
  'post-pour-over': 3,
  'post-ethiopia': 3,
}
const DEVICES = ['mobile', 'desktop'] as const
const SIDES = ['before', 'after'] as const

type Page = keyof typeof PAGES
type Side = (typeof SIDES)[number]
type Device = (typeof DEVICES)[number]

interface Options {
  sides: readonly Side[]
  pages: readonly Page[]
  astroPort: number
  browser: string
  /** A smaller session for a quick check; the protocol counts are the default. */
  runs: number | undefined
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      side: { type: 'string', default: 'both' },
      page: { type: 'string' },
      'astro-port': { type: 'string', default: '8787' },
      browser: { type: 'string', default: process.env.CHROME_PATH ?? BRAVE },
      runs: { type: 'string' },
    },
  })
  const side = values.side
  if (side !== 'both' && side !== 'before' && side !== 'after') {
    throw new Error(`--side must be "before", "after" or "both", not "${side}"`)
  }
  const pages = values.page ? [values.page as Page] : (Object.keys(PAGES) as Page[])
  for (const page of pages) {
    if (!(page in PAGES))
      throw new Error(`Unknown page "${page}": ${Object.keys(PAGES).join(', ')}`)
  }
  return {
    sides: side === 'both' ? SIDES : [side],
    pages,
    astroPort: Number(values['astro-port']),
    browser: values.browser,
    runs: values.runs ? Number(values.runs) : undefined,
  }
}

function url(side: Side, page: Page): string {
  const path = side === 'after' && page.startsWith('post-') ? `/blog${PAGES[page]}` : PAGES[page]
  return side === 'before' ? `http://larchwick.local${path}` : `http://${ASTRO_HOST}${path}`
}

async function reachable(target: string): Promise<boolean> {
  try {
    return (await fetch(target, { signal: AbortSignal.timeout(5000) })).ok
  } catch {
    return false
  }
}

function measure(options: Options, side: Side, page: Page, device: Device, run: number): void {
  const inbox = resolve(ROOT, `docs/${side}/lighthouse/inbox`)
  mkdirSync(inbox, { recursive: true })
  // The Astro build is served by `wrangler dev`; the browser maps its .local name there, so no
  // /etc/hosts entry is needed. Never localhost: Lighthouse would skip the https audits.
  const resolver =
    side === 'after'
      ? ` --host-resolver-rules="MAP ${ASTRO_HOST} 127.0.0.1:${options.astroPort}"`
      : ''
  execFileSync(
    'npx',
    [
      '-y',
      LIGHTHOUSE,
      url(side, page),
      '--quiet',
      '--output=json',
      `--output-path=${resolve(inbox, `${page}-${device}-${run}.json`)}`,
      `--chrome-flags=--headless=new ${NO_HTTPS_UPGRADE}${resolver}`,
      ...(device === 'desktop' ? ['--preset=desktop'] : []),
    ],
    {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'inherit'],
      env: { ...process.env, CHROME_PATH: options.browser },
    },
  )
}

async function main(): Promise<void> {
  const options = readOptions()
  if (!existsSync(options.browser)) {
    throw new Error(
      `No browser at ${options.browser}. Set CHROME_PATH (or pass --browser) to the executable of Chrome, Chromium or Brave; the default is Brave's macOS path.`,
    )
  }
  if (options.sides.includes('before') && !(await reachable('http://larchwick.local/'))) {
    throw new Error(
      'WordPress does not answer at http://larchwick.local/: start the site in LocalWP.',
    )
  }
  if (
    options.sides.includes('after') &&
    !(await reachable(`http://127.0.0.1:${options.astroPort}/`))
  ) {
    throw new Error(
      `The Astro build does not answer on port ${options.astroPort}: run \`npm run build && npx wrangler dev --port ${options.astroPort}\` first.`,
    )
  }
  const browserVersion = execFileSync(options.browser, ['--version'], { encoding: 'utf8' }).trim()
  const runs = (page: Page): number => options.runs ?? RUNS[page]
  const total =
    options.pages.reduce((sum, page) => sum + runs(page), 0) * DEVICES.length * options.sides.length
  console.log(`${browserVersion}, ${LIGHTHOUSE}: ${total} runs, sides alternating`)
  let done = 0
  // Page by page, device by device, run by run, the sides take turns, so any drift in the
  // machine's speed during the session lands on both sides alike.
  for (const page of options.pages) {
    for (const device of DEVICES) {
      for (let run = 1; run <= runs(page); run += 1) {
        for (const side of options.sides) {
          measure(options, side, page, device, run)
          done += 1
          console.log(`${done}/${total}  ${side.padEnd(6)} ${page} ${device} run ${run}`)
        }
      }
    }
  }
  console.log('Done. Import with: npm run lighthouse:import -- --side before (and --side after)')
}

await main()
