# Manual Screenshot Capture Guide

## Purpose
This guide helps capture screenshots of the SidePilot extension for DEVLOG documentation when automated Playwright tests face Chrome extension security restrictions.

## Prerequisites
1. Extension must be built: `npm run build`
2. Extension must be loaded in Chrome developer mode

## Steps

### 1. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `dist` folder
4. Note the extension ID (e.g., `abcdefghijklmnop`)

### 2. Open Side Panel
1. Navigate to any website (e.g., `https://example.com`)
2. Click the SidePilot extension icon in the toolbar
3. The side panel should open on the right side

### 3. Capture Screenshots
1. Use browser's built-in screenshot tools or:
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
4. Type "screenshot" and select "Capture full size screenshot"
5. Save to `screenshots/side-panel/` folder

### 4. Naming Convention
Use this format: `sidepanel-YYYY-MM-DD.png`

Example: `sidepanel-2026-01-12.png`

### 5. Update DEVLOG
Add screenshot reference to DEVLOG.md:
```markdown
**Screenshot**: ![SidePilot Side Panel](screenshots/side-panel/sidepanel-2026-01-12.png)
```

## Troubleshooting

### Side Panel Won't Open
- Check that extension loaded without errors
- Verify manifest.json has correct side_panel configuration
- Check browser console for errors

### Extension Not Loading
- Verify `dist/manifest.json` exists
- Check that `dist/sidepanel.html` exists
- Rebuild with `npm run build`

### Screenshot Quality
- Use full-size screenshots for best quality
- Ensure side panel is fully visible
- Capture with good lighting/contrast

## Automated Alternative
Once Chrome extension security issues are resolved, use:
```bash
npm run test:screenshots
```

This will automatically capture screenshots using Playwright.