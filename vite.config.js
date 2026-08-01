import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const distDir = path.resolve('dist');
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
        fs.copyFileSync(indexHtml, path.join(distDir, 'login.html'));
        const loginDir = path.join(distDir, 'login');
        if (!fs.existsSync(loginDir)) fs.mkdirSync(loginDir, { recursive: true });
        fs.copyFileSync(indexHtml, path.join(loginDir, 'index.html'));
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    proxy: {
      // Forward semua /api/* ke backend Next.js lokal
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
