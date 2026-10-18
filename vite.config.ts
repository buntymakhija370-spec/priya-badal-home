import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualiseApiPlugin } from './plugins/visualiseApi.ts'
import { workshopApiPlugin } from './plugins/workshopApi.ts'

// https://vite.dev/config/
export default defineConfig({
  // Absolute base so deep links like /product/:id load JS/CSS correctly
  base: '/',
  plugins: [react(), visualiseApiPlugin(), workshopApiPlugin()],
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})
