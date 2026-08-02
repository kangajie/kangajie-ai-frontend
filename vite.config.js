import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
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
  plugins: [
    react(),
    // Konfigurasi Legacy EKSTREM agar berjalan di Webview (Instagram/TikTok/dsb)
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 49', 'safari >= 10', 'ios >= 10', 'android >= 5'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: true,
    }),
    spaFallbackPlugin(),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    target: 'es2015', // Paksa build engine menargetkan ES2015 (bisa jalan hampir di mana saja)
    cssTarget: 'chrome61',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
