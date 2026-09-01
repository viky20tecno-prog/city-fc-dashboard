import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El CSS del bundle (~14 KB gz, Tailwind + estilos del dashboard) bloqueaba el
// render. En la landing NO hace falta para lo primero que se pinta: el fallback
// del index.html y el #lcp-hero (elemento LCP) son 100% inline-styled, y para
// cuando React monta la landing real (~5s en móvil) el CSS ya bajó hace rato.
// Así que lo cargamos sin bloquear (truco media=print) + <noscript> de respaldo.
function nonBlockingCss() {
  return {
    name: 'non-blocking-css',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet"((?:[^>]*?)href="\/assets\/[^"]+\.css"[^>]*?)>/g,
        (_, attrs) =>
          `<link rel="stylesheet"${attrs} media="print" onload="this.media='all'">` +
          `<noscript><link rel="stylesheet"${attrs}></noscript>`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), nonBlockingCss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/services/**', 'src/components/**', 'src/pages/**'],
      exclude: ['src/test/**', 'src/main.jsx'],
      reporter: ['text', 'html'],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'charts':        ['recharts'],
          'dompurify':     ['dompurify'],
          'lucide':        ['lucide-react'],
          'supabase':      ['@supabase/supabase-js'],
        },
      },
    },
  },
})
