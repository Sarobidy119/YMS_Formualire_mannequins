import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({ root: resolve(__dirname, 'apps/user'), envDir: __dirname, publicDir: resolve(__dirname, 'public'), plugins: [react()], server: { port: 5174 }, build: { outDir: resolve(__dirname, 'dist/user'), emptyOutDir: true } })
