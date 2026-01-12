import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        // Copy manifest.json to dist
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Create icons directory and placeholder icons
        mkdirSync('dist/icons', { recursive: true });
        
        // For now, we'll create placeholder icon files
        // In a real project, you'd convert the SVG to different sizes
        const iconSizes = [16, 48, 128];
        iconSizes.forEach(size => {
          copyFileSync('assets/Sidepilot.png', `dist/icons/icon${size}.png`);
        });
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, 'src/sidepanel/index.html'),
        'service-worker': path.resolve(__dirname, 'src/background/service-worker.ts'),
        content: path.resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});