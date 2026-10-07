import node from '@astrojs/node'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { siteConfig } from './src/lib/config/site'

export default defineConfig({
  site: siteConfig.url,

  output: 'static',

  integrations: [react(), sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Standalone Node.js server — used for Docker deployments.
  // The production image runs: node ./dist/server/entry.mjs
  adapter: node({ mode: 'standalone' }),
})
