export interface Author {
  slug: string
  name: string
}

export const AUTHOR_PATH = '/author/<author>'
export const AUTHOR_TEXT = 'larchwick-team'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseAuthors(data: unknown): Author[] {
  if (!Array.isArray(data)) throw new Error('The REST users endpoint did not return an array')
  return data.map((user: unknown, index) => {
    const { slug, name } = (user ?? {}) as Record<string, unknown>
    if (typeof slug !== 'string' || slug.trim() === '' || typeof name !== 'string') {
      throw new Error(`REST user #${index} has no slug or name`)
    }
    return { slug: slug.trim(), name: name.trim() }
  })
}

export class Scrubber {
  readonly #secrets: string[]
  readonly #authorPath: RegExp
  readonly #anywhere: RegExp

  constructor(authors: readonly Author[]) {
    const variants = authors.flatMap(({ slug, name }) =>
      [slug, name].flatMap((text) => [text, encodeURIComponent(text)]),
    )
    this.#secrets = [...new Set(variants.filter(Boolean).map((text) => text.toLowerCase()))].sort(
      (a, b) => b.length - a.length,
    )
    if (this.#secrets.length === 0) throw new Error('No author login or name to scrub')
    const alternatives = this.#secrets.map(escapeRegExp).join('|')
    this.#authorPath = new RegExp(`/author/(?:${alternatives})(?![\\w-])`, 'gi')
    this.#anywhere = new RegExp(alternatives, 'gi')
  }

  scrub(text: string): string {
    return text.replace(this.#authorPath, AUTHOR_PATH).replace(this.#anywhere, AUTHOR_TEXT)
  }

  leaks(text: string): boolean {
    const lower = text.toLowerCase()
    return this.#secrets.some((secret) => lower.includes(secret))
  }
}
