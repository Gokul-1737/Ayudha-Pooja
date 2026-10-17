import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    // strictPort: false so Vite auto-picks next available port if 5173 is busy
    strictPort: false,
  },
})
