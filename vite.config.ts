import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // <--- Add this to ensure absolute paths
  plugins: [react()],
  server: {
    host: true,       
    strictPort: true, 
    port: 5173,       
  }
})