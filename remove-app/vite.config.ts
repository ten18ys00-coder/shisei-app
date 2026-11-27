import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// GitHub Pages 用（dist-web/ → docs/）。1つのHTMLにまとめる
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  publicDir: process.env.VITE_DEMO === '1' ? false : 'public',
  build: { outDir: process.env.VITE_DEMO === '1' ? 'dist-demo' : 'dist-web', target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000 },
});
