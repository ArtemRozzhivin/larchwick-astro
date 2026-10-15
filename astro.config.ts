import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

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

  // Downloaded from Fontsource at build time and served from our own origin as woff2, latin only.
  // Layout.astro renders them with <Font>; the generated metric-matched fallbacks limit layout shift.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'DM Serif Display',
      cssVariable: '--font-dm-serif-display',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['sans-serif'],
    },
  ],

  // Sanity images are downloaded at build time and re-encoded to AVIF/WebP under /_astro/,
  // so pages load images from our own origin (the CSP allows img-src 'self' only).
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },

  // The contact form's thank-you and error pages are noindex, so they stay out of the sitemap.
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/contact/thanks/') && !page.includes('/contact/error/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
