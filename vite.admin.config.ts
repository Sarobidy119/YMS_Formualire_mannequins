import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({ root: resolve(__dirname, 'apps/admin'), envDir: __dirname, publicDir: resolve(__dirname, 'public'), plugins: [react()], server: { port: 5173 }, build: { outDir: resolve(__dirname, 'dist/admin'), emptyOutDir: true } })
