import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
