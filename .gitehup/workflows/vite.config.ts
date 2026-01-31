import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is the CRITICAL fix for GitHub Pages white screen.
  // It forces assets to be loaded relatively (e.g., "./assets/script.js") 
  // instead of absolutely (e.g., "/assets/script.js").
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});