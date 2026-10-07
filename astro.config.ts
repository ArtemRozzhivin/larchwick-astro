import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercelServerless from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { siteConfig } from './src/lib/config/site'

export default defineConfig({
  // Single source of truth: change the URL in src/lib/config/site.ts.
  // `site` is required for the sitemap and for canonical/OG URLs to be absolute.
  site: siteConfig.url,

  // Static output: every page is prerendered to HTML at build time, which is what
  // makes a landing page fast. Opt a single page into on-demand rendering with
  // `export const prerender = false` only when it genuinely needs a server.
  output: 'static',

  integrations: [react(), sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercelServerless(),
})
