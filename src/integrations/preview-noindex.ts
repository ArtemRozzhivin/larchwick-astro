import type { AstroIntegration } from 'astro'
import { appendFile } from 'node:fs/promises'

// The branch Workers Builds deploys to production; every other branch becomes a preview version.
const PRODUCTION_BRANCH = 'main'

/**
 * The `_headers` rule to add for this build, or null. Workers Builds sets WORKERS_CI_BRANCH; a
 * build without it (local, GitHub CI) is built as production. A local build deployed by hand
 * as a preview must set it: `npm run preview:deploy` does.
 */
export function previewNoindexRule(branch: string | undefined): string | null {
  if (!branch || branch === PRODUCTION_BRANCH) return null
  return '\n# Preview build: keep this version out of search engines.\n/*\n  X-Robots-Tag: noindex\n'
}

export function previewNoindex(): AstroIntegration {
  return {
    name: 'larchwick:preview-noindex',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const branch = process.env.WORKERS_CI_BRANCH
        const rule = previewNoindexRule(branch)
        if (!rule) return
        await appendFile(new URL('_headers', dir), rule)
        logger.info(`preview build of "${branch}": every response gets X-Robots-Tag: noindex`)
      },
    },
  }
}
