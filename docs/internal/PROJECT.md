# Project

> This file is a template. Replace every section below when you start a real
> landing from this repository, and keep it current from then on.

## What is this

An Astro landing-page template — a starter for marketing sites and landings. It ships finished page blocks, SEO wiring, and quality gates so a new
site starts with the structure already in place.

## Pages

| Route  | Page doc                 | Status      | Notes                                      |
| ------ | ------------------------ | ----------- | ------------------------------------------ |
| `/`    | [home](../pages/home.md) | placeholder | Demo landing composed from every block     |
| `/404` | [404](../pages/404.md)   | real        | Full-screen, no header or footer by design |

`/robots.txt` and `/sitemap-index.xml` are generated at build time from the site
config; they have no page doc.

## Still placeholder

Everything below has to be replaced before a real site launches:

- Site name, URL, description, and OG image — `src/lib/config/site.ts`
- Author name, email, and social links — same file
- Navigation items and footer links, including the legal pages they point at
  (`/privacy`, `/terms` do not exist yet)
- All home page copy — `src/lib/content/home.ts`
- The `og.png` social preview image referenced by the config but not in `public/`
- The favicon (`public/favicon.svg` is the Astro default)
- Colour tokens — `src/styles/global.css`
- Analytics: none is installed

## Notes

A migration of the Larchwick Coffee Roasters WordPress demo site onto this template (Astro +
Sanity, hosted on Cloudflare) is planned in [PLAN.md](../../PLAN.md). Until its Phase 2 lands,
everything above still describes the unmodified template.

Static output: every page is prerendered at build time. A page opts into
on-demand rendering individually; the site mode is never flipped to server.

Two build configs, kept in sync: the default targets Vercel, `astro.config.docker.ts`
targets a standalone Node server for the Docker image.
