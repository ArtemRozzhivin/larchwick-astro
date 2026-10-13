import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { siteConfig } from './src/lib/config/site'

export default defineConfig({
  // Single source of truth: change the URL in src/lib/config/site.ts.
  // `site` is required for the sitemap and for canonical/OG URLs to be absolute.
  site: siteConfig.url,

  // Static output: every page is prerendered to HTML at build time. There is no
  // adapter, so `export const prerender = false` is not available; the contact
  // endpoint is a separate Cloudflare Worker script (PLAN.md D-0, D-4).
  output: 'static',

  // Every URL keeps WordPress's trailing slash, so old links and the new routes match.
  trailingSlash: 'always',
  build: { format: 'directory' },

  // HTML whitespace rules (Astro 7 defaults to 'jsx'): prettier-plugin-astro 0.14 formats with
  // HTML whitespace semantics, so wrapped inline elements keep their spaces.
  compressHTML: true,

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
})
