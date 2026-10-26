/** The level of a section's item headings: h3 under the section's own h2, h2 when it has none. */
export function itemHeading(sectionHeading: string | undefined): 'h2' | 'h3' {
  return sectionHeading ? 'h3' : 'h2'
}
