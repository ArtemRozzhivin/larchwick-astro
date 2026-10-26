// UTC, so the date doesn't depend on the build machine's time zone: the assistant's passages
// (src/lib/rag/chunks.ts) must say exactly what the post page shows.
const POST_DATE = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' })

/** "1 October 2026": a post's publication date, as the blog shows it. */
export function formatPostDate(iso: string): string {
  return POST_DATE.format(new Date(iso))
}
