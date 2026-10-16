---
route: /blog/, /blog/<slug>/, /blog/category/<slug>/, /blog/tag/<slug>/
status: real
---

# Blog

## Purpose

The posts imported from WordPress, now edited in Sanity Studio: brewing guides, coffee origins and
roastery news.

## Pages

- **`/blog/`**: the H1 "The Larchwick blog", a short intro and every post as a card, newest first.
- **`/blog/<slug>/`**: a post. Category, date and the byline "Larchwick Team"; the title (H1) and
  excerpt; the featured image; the body; tags; links to the newer and older post; up to three
  related posts from the same category.
- **`/blog/category/<slug>/`** and **`/blog/tag/<slug>/`**: the posts in one category or tag.
  Only terms with at least one post get a page.

## Key interactions

- Cards, categories and tags all link onward; nothing needs JavaScript.
- The archive and post headers rise in once on load, and the featured image fades in.
- Photos show a blurred preview while they load. The post body's paragraphs, headings, lists and
  images fade up as they scroll into view (off for visitors who reduce motion).

## Content owner

Posts, categories and tags are edited in Sanity Studio. The index and archive copy (heading,
intro, labels) is in `src/lib/content/blog.ts`; the blog page document in Sanity can override the
index's SEO title and description.

## Known limitations

- No pagination: 10 posts fit on one page. Add it if the blog grows past about 24 posts.
- No RSS, comments or likes, by design (PLAN.md D-8).
- Tag names are lowercase in WordPress; the site capitalises the first letter for display.
