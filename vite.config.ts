import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev uses native ESM + pre-bundling; production bundling is Rollup or Rolldown.
// Best-practice: keep default splitting and only group very common heavy deps.
// Add Rolldown's advancedChunks while keeping Rollup's manualChunks for compatibility.
export default defineConfig(({ command }) => {
  return {
    base: process.env.BASE_PATH || '/',
    plugins: [react()],
    server: {
      // Warm up commonly-hit modules to avoid initial transform waterfalls in dev
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx', './src/components/*.tsx']
      }
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          // Rollup (fallback) – coarse vendor chunk for big deps
          manualChunks(id) {
            if (/\/(react(?:-dom)?|animejs|katex)\b/.test(id)) return 'vendor'
          },
          // Rolldown – fine-grained groups using advancedChunks API
          // Ignored by Rollup; used when running via rolldown-vite
          advancedChunks: {
            groups: [
              { name: 'vendor', test: /\/(react(?:-dom)?|animejs|katex)\b/ }
            ]
          }
        }
      }
    }
  }
})
