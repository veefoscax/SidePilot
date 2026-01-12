# Side Panel Test Guide

## Prerequisites
1. Chrome browser (version 114 or later for sidePanel API support)
2. Extension built with `npm run build`

## Manual Testing Steps

### 1. Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. Verify the extension appears in the list without errors

### 2. Test Side Panel Opening
1. Look for the SidePilot extension icon in the Chrome toolbar
2. Click the extension icon OR
3. Right-click on the extension icon and select "Open side panel"
4. The side panel should open on the right side of the browser

### 3. Verify Side Panel Content
1. The side panel should display the React app
2. You should see the SidePilot interface
3. The panel should use dark mode styling
4. No console errors should appear in the browser DevTools

### 4. Test Console Script (Optional)
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Copy and paste the content of `test-sidepanel.js`
4. Press Enter to run the test
5. Check for ✅ success messages and no ❌ error messages

## Expected Results
- ✅ Extension loads without errors
- ✅ Side panel opens when clicked
- ✅ React app renders in the side panel
- ✅ Dark mode styling is applied
- ✅ No console errors

## Troubleshooting
- If side panel doesn't open: Check Chrome version (needs 114+)
- If React app doesn't load: Check console for JavaScript errors
- If styling is broken: Verify CSS files are loaded correctly
- If extension doesn't load: Check manifest.json syntax

## Files Verified
- `dist/manifest.json` - Extension configuration
- `dist/src/sidepanel/index.html` - Side panel HTML
- `dist/sidepanel.js` - React application bundle
- `dist/assets/sidepanel-*.css` - Styling