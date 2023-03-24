import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '/node_modules/.vite/deps/tesseract-worker.js': '/node_modules/tesseract-wasm/dist/tesseract-worker.js',
      '/node_modules/.vite/deps/tesseract-core.wasm': '/node_modules/tesseract-wasm/dist/tesseract-core.wasm',
    }
  }
})
