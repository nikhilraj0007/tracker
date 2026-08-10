import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['paisa-mark.svg'],
      manifest: {
        id: '/',
        name: 'Paisa — Personal Money Tracker',
        short_name: 'Paisa',
        description: 'A private, local-first budget and expense tracker.',
        theme_color: '#143c32',
        background_color: '#f5f6f1',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          { src: 'paisa-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'paisa-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Add transaction', short_name: 'Add', url: '/?view=transactions', icons: [{ src: 'paisa-mark.svg', sizes: 'any', type: 'image/svg+xml' }] },
          { name: 'Open Money Plan', short_name: 'Money Plan', url: '/?view=budgets', icons: [{ src: 'paisa-mark.svg', sizes: 'any', type: 'image/svg+xml' }] },
          { name: 'Open Workspace', short_name: 'Workspace', url: '/?view=workspace', icons: [{ src: 'paisa-mark.svg', sizes: 'any', type: 'image/svg+xml' }] }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});
