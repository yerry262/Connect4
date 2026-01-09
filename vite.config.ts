/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: '/Connect4/',
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: true, // Fail if port is already in use
    },
    preview: {
      port: parseInt(env.VITE_PORT || '5173'),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    },
  }
})
