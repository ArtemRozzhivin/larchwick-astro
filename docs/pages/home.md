---
route: /
status: real
---

# Home

## Purpose

The front door of Larchwick Coffee Roasters, a fictional specialty coffee roaster. It tells a
visitor what Larchwick sells and sends them on to the coffees, the story behind the roastery, the
services for businesses, the blog or a subscription enquiry.

## Sections, in order

All of them are sections of the `home` page document in Sanity Studio (rebuilt in Phase 5c from
the old Elementor layout; the importer never overwrites them).

1. **Hero** — a larch-green band: "Specialty coffee roastery · Est. 2019", the H1 "Fresh
   coffee, roasted in small batches", a paragraph, two buttons ("Shop our coffees", "Our story")
   and three ticked promises. Beside it, the hero's **Coffee label** for Ethiopia Yirgacheffe
   (origin, process, altitude, variety, roast, tasting notes, "€14 for 250 g") with a "Roasted to
   order, Mon & Thu" stamp that presses on once on load. The hero photo stays in Sanity but is
   hidden while the label is filled in.
2. **Features** — "Roasted to order", "Fully traceable" and "Brewing help", each with a cup icon.
3. **Our coffees** — the **Bags** layout: four coffee bags (Ethiopia Yirgacheffe, Colombia
   Huila, House Espresso, Autumn Blend) coloured by roast, with one line, the roast and the 250 g
   price from the products page, and a "See all coffees" button. The card photos stay in Sanity
   but the bags layout doesn't show them.
4. **From farm to your cup** — on a light band: "We taste", "We roast", "We ship" with icons.
5. **For cafés and offices** — photo and text, four bullet points and "Explore services".
6. **From the blog** — the three newest posts, filled in automatically at build time, and "Read
   the blog".
7. **Try a subscription** — call to action on a gold band, "Ask about subscriptions".

The hero's text, buttons and label rise in one after another on load. Blocks below the hero fade
up as they scroll into view (CSS only; off for reduced motion and in
browsers without scroll-driven animations).

The header (menu) and footer (contact details, opening hours, the demo label) come from Site
settings in Sanity.

## Search and sharing

- Page title and description: the old site's Yoast values, word for word, stored in Sanity.
- Shared links show the Larchwick coffee-bean preview image.
- Search engines get Organization and WebSite structured data (name, website, email, phone).

## Content owner

Edited in Sanity Studio (Pages → Home). Changes go live with the next build.

## Known limitations

- The design still follows the WordPress site closely; a redesign is planned for later (PLAN.md
  Phase 10).
