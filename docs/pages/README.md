# Page Documentation

One file per page on the site, written for anyone — PM, QA, client, or dev — not
just engineers. Each explains what the page is for, what it contains, and what is
still placeholder content.

**Status legend:** `real` — final copy and assets · `partial` — a mix of real and
placeholder content · `placeholder` — template content only.

## Pages

| Page                              | Route                                                                    | What it's for                                        | Status |
| --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- | ------ |
| [Home](home.md)                   | `/`                                                                      | Larchwick's front door: coffees, story, subscription | real   |
| [404](404.md)                     | `/404`                                                                   | Shown when a visitor hits an address that is gone    | real   |
| [Blog](blog.md)                   | `/blog/`, posts, categories, tags                                        | The imported posts and their archives                | real   |
| [Content pages](content-pages.md) | `/about/`, `/services/`, `/products/`, `/faq/`, `/contact/`, `/privacy/` | Built from Sanity page documents                     | real   |

## On every page

The "Ask Larchwick" button (bottom right; a round chat icon on phones) opens the AI assistant, which
answers from this website's content and links the pages it used (PLAN.md Phase 7b). Its copy is in
`src/lib/content/chat.ts`.

On the first visit a small banner (bottom left; full width on phones) asks whether Google Analytics
may measure the visit. Nothing is sent to Google before "Accept", and only production sends data
(PLAN.md Phase 7c). "Privacy" and "Cookie settings" (which reopens the banner) are at the bottom of
the footer. Its copy is in `src/lib/content/consent.ts`. After "Accept", hero and call-to-action
buttons, email and phone links and the assistant send events to GA (PLAN.md Phase 7c lists them).

## Adding a page

Add a row here and create `docs/pages/<page>.md` in the same change that adds the
route. The filename matches the route: `src/pages/pricing.astro` →
`docs/pages/pricing.md`, and `src/pages/index.astro` → `docs/pages/home.md`.
