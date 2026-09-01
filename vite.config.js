import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// NOTA (1 sep 2026): hubo un plugin `nonBlockingCss()` que cargaba el
// index-*.css con el truco media="print" para no bloquear el render. Rompió
// TODAS las rutas menos la landing: `media="print"` baja el CSS a prioridad
// baja, y en el dashboard (657KB de JS) el JS renderiza ANTES de que el CSS
// aplique → dashboard sin estilos + el #lcp-hero asomando por detrás. Revertido.
//
// En su lugar: INCRUSTAR el CSS del bundle como <style> inline en el <head>.
// Se comporta igual que la hoja bloqueante (el navegador la aplica antes de
// pintar, junto con el HTML) — no puede haber "renderiza antes que el CSS"
// porque el CSS viene EN el HTML. La única diferencia: cero requests / cero
// ida y vuelta, así que quita el aviso "solicitudes que bloquean el render".
// Aplica a todas las rutas (el index.html es uno solo); +~25 KB gz al HTML,
// nada al lado del JS que ya carga cada ruta.
function inlineBundleCss() {
  return {
    name: 'inline-bundle-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html
      let out = html
      for (const [fileName, asset] of Object.entries(ctx.bundle)) {
        if (asset.type !== 'asset' || !fileName.endsWith('.css')) continue
        const css = typeof asset.source === 'string'
          ? asset.source
          : Buffer.from(asset.source).toString('utf8')
        const base = fileName.split('/').pop()
        // Saca el <link rel="stylesheet" ... href=".../<base>" ...>
        out = out.replace(
          new RegExp(`\\s*<link[^>]+href="[^"]*${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
          '',
        )
        // Inyecta el CSS justo antes de </head> (después de los <style> propios)
        out = out.replace('</head>', `<style>${css}</style>\n  </head>`)
        // No emitir el .css suelto (ya no lo referencia nadie)
        delete ctx.bundle[fileName]
      }
      return out
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineBundleCss()],
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
