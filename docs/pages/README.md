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
answers from this website's content and links the pages it used (PLAN.md Phase 7b). Its wording
is kept in the site's code, not in the Studio. A visitor can ask about 10 questions a minute, and
all visitors together about 60; beyond the first the panel asks them to wait a minute, beyond the
second it says the assistant is busy right now. These limits slow questions down but don't cap how
many come in a day: the monthly spending limit set with the AI provider does, and once it is
reached the assistant says it isn't available until the next month. If the assistant can't answer
within 30 seconds, or can't load at all, the panel says it isn't available and links the contact
page. While an answer is still arriving, its links can't be clicked yet; they work once it is
complete.

On the first visit a small banner (bottom left; full width on phones) asks whether Google Analytics
may measure the visit. Nothing is sent to Google before "Accept", and only production sends data
(PLAN.md Phase 7c). Escape closes the banner without a choice; it asks again on the next page. On
small or zoomed screens it scrolls instead of growing past the window. On very short screens (a
phone held sideways, a page zoomed to 400%) the menu bar scrolls away with the page, and while the
banner is open each item the keyboard moves to is scrolled into view above it. On an ordinary phone
screen the open banner can still hide items near the bottom until the visitor chooses or presses
Escape. "Privacy" and "Cookie settings" (which reopens the banner) are at the bottom of
the footer. Its wording is kept in the site's code. After "Accept", hero and call-to-action
buttons, email and phone links and the assistant send events to GA (PLAN.md Phase 7c lists them).

## Adding a page

Add a row here and create `docs/pages/<page>.md` in the same change that adds the
route. The filename matches the route: `src/pages/pricing.astro` →
`docs/pages/pricing.md`, and `src/pages/index.astro` → `docs/pages/home.md`.
