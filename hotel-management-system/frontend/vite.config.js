import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/RESTA-FOOD/',
  server: {
    watch: {
      usePolling: true,
      interval: 120,
    },
  },
})