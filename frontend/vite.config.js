import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const brand = JSON.parse(readFileSync(new URL('./brand.config.json', import.meta.url), 'utf8'))

const brandHtml = {
  name: 'brand-html',
  transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', brand.name).replaceAll('%BRAND_DESCRIPTION%', brand.description),
}

export default defineConfig({
  plugins: [react(), tailwindcss(), brandHtml],
  server: {
    host: '0.0.0.0',
    port: 45173,
    strictPort: true,
  },
  preview: {
    port: 45173,
    strictPort: true,
  },
})
