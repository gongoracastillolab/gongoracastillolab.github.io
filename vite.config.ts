import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // En dev, /admin debe servir public/admin/index.html (Decap CMS), no la SPA
    {
      name: 'serve-admin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/admin' || req.url === '/admin/') {
            const adminHtml = path.join(__dirname, 'public', 'admin', 'index.html')
            const html = fs.readFileSync(adminHtml, 'utf-8')
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }
          next()
        })
      },
    },
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
