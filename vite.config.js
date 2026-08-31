import { defineConfig } from 'vite'

export default defineConfig({
  base: '/trackapartLV/',
  // Vite's default modulepreload polyfill is an inline <script> in the built
  // index.html, which the CSP meta tag's script-src (no 'unsafe-inline')
  // would block. All target browsers support native modulepreload, so skip it.
  build: {
    modulePreload: { polyfill: false },
  },
})
