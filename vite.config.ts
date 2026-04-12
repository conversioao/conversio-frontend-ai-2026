import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: '.',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icons/*.png', 'logo.png', 'offline.html'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*contabostorage\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'conversio-media-cache-v1',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            }
          ]
        },
        manifest: {
          name: 'Conversio AI',
          short_name: 'Conversio',
          description: 'Cria anúncios profissionais com IA em segundos',
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'portrait-primary',
          background_color: '#050508',
          theme_color: '#050508',
          lang: 'pt',
          dir: 'ltr',
          categories: ['productivity', 'business'],
          prefer_related_applications: false,
          icons: [
            { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
          ]
        }
      })
    ],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
    },
  };
});
