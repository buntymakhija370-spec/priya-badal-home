import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualiseApiPlugin } from './plugins/visualiseApi.ts'

// https://vite.dev/config/
export default defineConfig({
  // Absolute base so deep links like /product/:id load JS/CSS correctly
  base: '/',
  plugins: [react(), visualiseApiPlugin()],
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})
