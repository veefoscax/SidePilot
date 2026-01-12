#!/usr/bin/env node

/**
 * SidePilot Icon Generation Script
 * 
 * Generates Chrome extension icons from SVG with theme awareness.
 * Creates light and dark variants that blend with Chrome's interface.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'assets', 'Sidepilot.svg'); // Back to your updated icon
const iconsDir = path.join(projectRoot, 'public', 'icons');

// Icon sizes required by Chrome extension manifest
const iconSizes = [16, 48, 128];

// Theme-aware color schemes
const themes = {
  light: {
    fill: '#1f2937', // Dark gray for light theme
    background: 'transparent'
  },
  dark: {
    fill: '#f9fafb', // Light gray for dark theme  
    background: 'transparent'
  }
};

async function generateIcons() {
  console.log('🎨 Generating SidePilot icons from SVG...');
  console.log('Project root:', projectRoot);
  console.log('SVG path:', svgPath);
  console.log('Icons dir:', iconsDir);
  
  // Check if SVG file exists
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ SVG file not found: ${svgPath}`);
    return;
  }
  
  console.log('✅ SVG file found');
  
  // Ensure directories exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`✅ Created icons directory: ${iconsDir}`);
  }
  
  // Read the original SVG
  let svgContent;
  try {
    svgContent = fs.readFileSync(svgPath, 'utf8');
    console.log(`✅ SVG content loaded (${svgContent.length} characters)`);
  } catch (error) {
    console.error(`❌ Error reading SVG file:`, error.message);
    return;
  }
  
  // For Chrome extensions theme adaptation with your updated icon
  // The SVG now uses 'd' paths instead of fill attributes, so we need a different approach
  
  console.log('🔄 Processing your updated icon for theme switching...');
  
  // Create light icons (for dark themes) - wrap in colored group
  const lightColor = '#f9fafb'; // Light color for dark themes
  const lightSvgContent = svgContent.replace(
    /<svg([^>]*)>/,
    `<svg$1><g fill="${lightColor}">`
  ).replace('</svg>', '</g></svg>');
  
  // Create dark icons (for light themes) - wrap in colored group
  const darkColor = '#1f2937'; // Dark color for light themes
  const darkSvgContent = svgContent.replace(
    /<svg([^>]*)>/,
    `<svg$1><g fill="${darkColor}">`
  ).replace('</svg>', '</g></svg>');
  
  console.log('✅ SVG color wrapping applied for theme switching');
  
  // Generate main icons (default to light icons for dark themes)
  for (const size of iconSizes) {
    try {
      const outputPath = path.join(iconsDir, `icon${size}.png`);
      
      // Use light icons as default (works better on dark Chrome themes)
      await sharp(Buffer.from(lightSvgContent))
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: false // Ensure full color depth
        })
        .toFile(outputPath);
      
      // Verify file was created and get size
      const stats = fs.statSync(outputPath);
      console.log(`✅ Generated icon${size}.png (your updated icon - light for dark themes, ${Math.round(stats.size / 1024)}KB)`);
      
    } catch (error) {
      console.error(`❌ Error generating icon${size}.png:`, error.message);
    }
  }
  
  // Generate theme-specific variants for dynamic switching
  console.log('\n🎭 Generating theme-specific icon sets...');
  
  const themeConfigs = {
    light: { 
      color: darkColor, 
      svg: darkSvgContent, 
      description: 'your updated icon - dark for light themes' 
    },
    dark: { 
      color: lightColor, 
      svg: lightSvgContent, 
      description: 'your updated icon - light for dark themes' 
    }
  };
  
  for (const [themeName, config] of Object.entries(themeConfigs)) {
    for (const size of iconSizes) {
      try {
        const outputPath = path.join(iconsDir, `icon${size}-${themeName}.png`);
        
        await sharp(Buffer.from(config.svg))
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: false // Ensure full color depth
          })
          .toFile(outputPath);
        
        const stats = fs.statSync(outputPath);
        console.log(`  📄 icon${size}-${themeName}.png (${config.description}, ${Math.round(stats.size / 1024)}KB)`);
        
      } catch (error) {
        console.error(`❌ Error generating ${themeName} icon${size}.png:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 Icon generation completed!');
  console.log('\nGenerated files:');
  console.log('📁 public/icons/');
  
  const files = fs.readdirSync(iconsDir);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      const filePath = path.join(iconsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  📄 ${file} (${Math.round(stats.size / 1024)}KB)`);
    }
  });
  
  console.log('\n📋 Next steps:');
  console.log('1. Run `npm run build` to copy icons to dist/');
  console.log('2. Load extension in Chrome to verify icons appear correctly');
  console.log('3. Test in both light and dark Chrome themes');
}

// Run the function directly
console.log('🚀 Starting icon generation...');
generateIcons().catch(error => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});

export { generateIcons };