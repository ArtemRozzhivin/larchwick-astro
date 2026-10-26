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
  Only terms with at least one post get a page. A term's description, when it has one, is shown
  as the intro under the heading.

## Key interactions

- Cards, categories and tags all link onward; nothing needs JavaScript.
- The archive and post headers rise in once on load, and the featured image fades in.
- Photos show a blurred preview while they load. The post body's paragraphs, headings, lists and
  images fade up as they scroll into view (off for visitors who reduce motion).

## Search and sharing

- Posts keep their Yoast titles; a post without a description uses its excerpt. Archive pages are
  titled like "Brewing Guides | Larchwick Blog".
- An editor can hide a post or the blog index from search engines, or point its canonical address
  elsewhere, in the post's (or the blog page's) SEO fields; the site follows both, and leaves
  either kind out of the sitemap. A post pointed elsewhere names that address in its article
  details for search engines too.
- Shared links show the post's social image, or its featured image cropped to the social card
  size. When that picture is the featured image, its description goes with it.
- Search engines get the post as an article written by Larchwick Coffee Roasters, plus a
  breadcrumb trail: Home › Blog › the post.
- A tag that only one post uses gets a page, but it is kept out of search engines and the
  sitemap, since it would repeat that post (today: Colombia and Ethiopia). The sitemap dates each
  post with its last edit, the blog index with the newest post's, and each category and tag page
  with the latest edit of the category or tag itself or of the most recently edited post on the
  blog, whichever is later. So a page's date never goes back when a post moves to another
  category or tag; only deleting the most recently edited post can move these dates back.

## Content owner

Posts, categories and tags are edited in Sanity Studio. The index and archive copy (heading,
intro, labels) is kept in the site's code; the blog page document in Sanity can override the
index's SEO title and description.

## Known limitations

- No pagination: 10 posts fit on one page. Add it if the blog grows past about 24 posts.
- No RSS, comments or likes, by design (PLAN.md D-8).
- Tag names are lowercase in WordPress; the site capitalises the first letter for display.
- Descriptions for the 3 categories and 8 tags are written but not yet published: they wait as
  drafts in Sanity Studio. Until an editor publishes them, archives have no intro and a generated
  search description; publishing each one also shows it on its archive page.
