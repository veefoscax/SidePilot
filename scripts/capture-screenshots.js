#!/usr/bin/env node

/**
 * SidePilot Screenshot Capture Script
 * 
 * This script automates the capture of screenshots for DEVLOG documentation.
 * It runs the Playwright tests and organizes screenshots with proper naming.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'screenshots');

// Ensure screenshots directory structure exists
const screenshotDirs = [
  'side-panel',
  'extension-loading',
  'testing',
  'development'
];

console.log('🚀 Setting up screenshot directories...');

screenshotDirs.forEach(dir => {
  const fullPath = path.join(screenshotsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${fullPath}`);
  }
});

// Function to run screenshot tests
function runScreenshotTests() {
  console.log('\n📸 Running screenshot capture tests...');
  
  try {
    // Build the extension first
    console.log('🔨 Building extension...');
    execSync('npm run build', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    
    // Run the screenshot tests
    console.log('🧪 Running Playwright screenshot tests...');
    execSync('npx playwright test tests/sidepanel-screenshot.spec.ts --reporter=line', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    
    console.log('✅ Screenshot tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running screenshot tests:', error.message);
    process.exit(1);
  }
}

// Function to organize and rename screenshots
function organizeScreenshots() {
  console.log('\n📁 Organizing screenshots...');
  
  const sidePanelDir = path.join(screenshotsDir, 'side-panel');
  
  if (!fs.existsSync(sidePanelDir)) {
    console.log('⚠️ No side-panel directory found');
    return;
  }
  
  const files = fs.readdirSync(sidePanelDir);
  const pngFiles = files.filter(file => file.endsWith('.png'));
  
  console.log(`📸 Found ${pngFiles.length} screenshot files`);
  
  // Create a summary of screenshots
  const summary = {
    timestamp: new Date().toISOString(),
    screenshots: [],
    totalFiles: pngFiles.length
  };
  
  pngFiles.forEach(file => {
    const filePath = path.join(sidePanelDir, file);
    const stats = fs.statSync(filePath);
    
    summary.screenshots.push({
      filename: file,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      path: `screenshots/side-panel/${file}`
    });
    
    console.log(`  📄 ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
  
  // Save summary file
  const summaryPath = path.join(sidePanelDir, 'screenshot-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`✅ Screenshot summary saved: ${summaryPath}`);
  
  return summary;
}

// Function to generate DEVLOG screenshot section
function generateDevlogSection(summary) {
  if (!summary || summary.screenshots.length === 0) {
    return '';
  }
  
  const latestScreenshot = summary.screenshots
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];
  
  return `
## Screenshots

### Latest Side Panel Screenshot
![SidePilot Side Panel](${latestScreenshot.path})

**Captured**: ${new Date(latestScreenshot.created).toLocaleString()}  
**Size**: ${Math.round(latestScreenshot.size / 1024)}KB

### All Screenshots
${summary.screenshots.map(shot => 
  `- [${shot.filename}](${shot.path}) (${Math.round(shot.size / 1024)}KB)`
).join('\n')}

**Total Screenshots**: ${summary.totalFiles}  
**Last Updated**: ${new Date(summary.timestamp).toLocaleString()}
`;
}

// Main execution
function main() {
  console.log('🎯 SidePilot Screenshot Capture Script');
  console.log('=====================================\n');
  
  // Run screenshot tests
  runScreenshotTests();
  
  // Organize screenshots
  const summary = organizeScreenshots();
  
  // Generate DEVLOG section
  if (summary) {
    const devlogSection = generateDevlogSection(summary);
    const devlogPath = path.join(projectRoot, 'DEVLOG-screenshots.md');
    fs.writeFileSync(devlogPath, devlogSection);
    console.log(`✅ DEVLOG screenshot section saved: ${devlogPath}`);
  }
  
  console.log('\n🎉 Screenshot capture completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review screenshots in screenshots/side-panel/');
  console.log('2. Copy relevant screenshots to DEVLOG.md');
  console.log('3. Update documentation with screenshot paths');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runScreenshotTests, organizeScreenshots, generateDevlogSection };