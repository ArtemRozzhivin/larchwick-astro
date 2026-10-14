import { describe, expect, it } from 'vitest'

import { rewriteHref } from './links.ts'
import { ORIGIN } from './testing.ts'

const rules = { origin: ORIGIN, postSlugs: new Set(['choosing-the-right-grind-size']) }

function rewrite(href: string) {
  const changes: { from: string; to: string; reason: string }[] = []
  return { href: rewriteHref(href, rules, (change) => changes.push(change)), changes }
}

describe('rewriteHref', () => {
  it('moves old post URLs under /blog/', () => {
    expect(rewrite('/choosing-the-right-grind-size/').href).toBe(
      '/blog/choosing-the-right-grind-size/',
    )
  })

  it('strips the WordPress origin and adds the trailing slash', () => {
    const result = rewrite(`${ORIGIN}/contact`)
    expect(result.href).toBe('/contact/')
    expect(result.changes[0].reason).toContain('trailing slash added')
  })

  it('keeps query strings and anchors after the slash', () => {
    expect(rewrite('/faq#shipping').href).toBe('/faq/#shipping')
  })

  it('leaves files, external links, mailto and tel alone', () => {
    for (const href of [
      '/robots.txt',
      'https://en.wikipedia.org/wiki/Yirgacheffe',
      'mailto:a@b.example',
      'tel:+40700',
    ]) {
      expect(rewrite(href)).toEqual({ href, changes: [] })
    }
  })

  it('flags an empty "#" link instead of guessing a target', () => {
    const result = rewrite('#')
    expect(result.href).toBe('#')
    expect(result.changes[0].reason).toMatch(/needs a real target/)
  })
})
