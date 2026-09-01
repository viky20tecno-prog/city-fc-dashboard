import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// NOTA (1 sep 2026): hubo un plugin `nonBlockingCss()` que cargaba el
// index-*.css con el truco media="print" para no bloquear el render. Rompió
// TODAS las rutas menos la landing: `media="print"` baja el CSS a prioridad
// baja, y en el dashboard (657KB de JS) el JS renderiza ANTES de que el CSS
// aplique → dashboard sin estilos + el #lcp-hero asomando por detrás. Revertido.
// Si se retoma, tiene que ser SOLO para `/` (el resto sí necesita el CSS para
// el primer render).

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
