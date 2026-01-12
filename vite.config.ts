import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest-and-html',
      writeBundle() {
        // Copy manifest.json to dist
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Copy sidepanel HTML to root of dist for manifest compatibility
        copyFileSync('dist/src/sidepanel/index.html', 'dist/sidepanel.html');
        
        // Create icons directory and copy icons
        mkdirSync('dist/icons', { recursive: true });
        
        // Check if proper icons exist, otherwise use placeholder
        const iconSizes = [16, 48, 128];
        iconSizes.forEach(size => {
          const properIconPath = `public/icons/icon${size}.png`;
          const placeholderPath = 'assets/Sidepilot.png';
          
          try {
            // Try to copy proper icon first
            copyFileSync(properIconPath, `dist/icons/icon${size}.png`);
            console.log(`✅ Copied proper icon: icon${size}.png`);
          } catch (error) {
            // Fall back to placeholder
            copyFileSync(placeholderPath, `dist/icons/icon${size}.png`);
            console.log(`⚠️ Using placeholder for icon${size}.png - generate proper icons from SVG`);
          }
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