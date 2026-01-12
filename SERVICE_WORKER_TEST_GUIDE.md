# Service Worker Test Guide

## Overview
This guide provides step-by-step instructions to verify that the SidePilot service worker is running correctly.

## Prerequisites
- Chrome browser with Developer mode enabled
- Built extension (run `npm run build`)

## Test Steps

### 1. Load Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. Verify SidePilot appears in the extensions list

### 2. Check Service Worker Registration
1. In `chrome://extensions/`, find SidePilot
2. Click "Details"
3. Click "Inspect views: service worker" (if available)
4. If no "service worker" link appears, the worker may be inactive

### 3. Activate Service Worker
1. Click the SidePilot extension icon in the toolbar
2. This should activate the service worker
3. Return to `chrome://extensions/` and click "Details" again
4. You should now see "Inspect views: service worker"

### 4. Verify Service Worker Console Logs
1. Click "Inspect views: service worker"
2. This opens DevTools for the service worker
3. Check the Console tab for these messages:
   ```
   🚀 SidePilot service worker starting...
   ✅ SidePilot service worker ready!
   ```
4. If you click the extension icon, you should also see:
   ```
   🎯 Extension icon clicked, opening side panel
   ```

### 5. Test Service Worker Functionality
1. Click the SidePilot extension icon
2. Verify the side panel opens
3. Check that no errors appear in the service worker console

### 6. Alternative Verification Method
1. Open any webpage
2. Open DevTools (F12)
3. Go to Application tab > Service Workers
4. Look for the SidePilot service worker in the list
5. Status should show "activated and is running"

## Expected Results

### ✅ Success Indicators
- Extension loads without errors in `chrome://extensions/`
- Service worker appears in DevTools Application tab
- Console shows startup messages
- Extension icon click opens side panel
- No error messages in service worker console

### ❌ Failure Indicators
- Extension shows errors in `chrome://extensions/`
- No service worker appears in Application tab
- Missing console startup messages
- Extension icon click does nothing
- Error messages in service worker console

## Troubleshooting

### Service Worker Not Appearing
- Ensure extension is properly loaded
- Try clicking the extension icon to activate it
- Refresh the extension in `chrome://extensions/`

### Console Messages Missing
- Check that you're looking at the service worker console, not the page console
- Ensure the extension was built correctly (`npm run build`)
- Verify `dist/service-worker.js` exists and contains code

### Side Panel Not Opening
- Check service worker console for error messages
- Verify manifest.json has correct side panel configuration
- Ensure `dist/sidepanel.html` exists

## Automated Test
Run the automated test script:
```bash
node test-service-worker.js
```

This provides additional verification steps and checks.