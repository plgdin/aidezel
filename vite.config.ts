import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Exposes app to IPv4/IPv6 (Required for Vercel)
    strictPort: true, // Prevents Vite from switching ports unexpectedly
    port: 5173,       // Locks the internal port
  }
})