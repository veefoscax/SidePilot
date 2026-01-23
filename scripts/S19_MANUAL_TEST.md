# S19: Element Pointer - Manual Testing Guide

## Prerequisites
1. Build the extension: `npm run build`
2. Load the extension in Chrome (chrome://extensions/)
3. Open any website in a new tab
4. Open SidePilot side panel

## Test Flow

### Test 1: Button Visibility
**Expected**: 🎯 button should be visible in the chat input area (bottom right of textarea)

✅ Pass / ❌ Fail: ___

---

### Test 2: Activate Element Pointer
1. Click the 🎯 button in chat input
2. **Expected**: 
   - Toast notification: "🎯 Element pointer activated. Click an element on the page."
   - Button should change appearance (highlighted)

✅ Pass / ❌ Fail: ___

---

### Test 3: Hover Highlighting
1. After activation, move mouse over elements on the web page
2. **Expected**: 
   - Elements should be highlighted with a border as you hover
   - Highlight should follow your mouse

✅ Pass / ❌ Fail: ___

---

### Test 4: Element Selection
1. Click on any element (e.g., a button, link, or heading)
2. **Expected**:
   - Element should be marked as selected
   - Comment input box should appear
   - Element should have an assigned ref (e.g., @e1, @e2)

✅ Pass / ❌ Fail: ___

---

### Test 5: Add Comment
1. After selecting an element, type a comment (e.g., "click this button")
2. Press Enter or click "Done" button
3. **Expected**:
   - Comment input should close
   - Overlay should disappear
   - Chat input placeholder should update to show element is selected

✅ Pass / ❌ Fail: ___

---

### Test 6: Element Context in Message
1. Type a message in the chat input (e.g., "What does this do?")
2. Send the message
3. **Expected**:
   - Message should include element context at the beginning:
     ```
     User pointed at element:
     - Ref: @e1
     - Position: (x, y)
     - Size: WxH
     - Text: "..."
     - Comment: "click this button"
     
     What does this do?
     ```

✅ Pass / ❌ Fail: ___

---

### Test 7: Cancel with Escape
1. Click 🎯 button to activate
2. Click an element
3. Press Escape key
4. **Expected**:
   - Comment input should close
   - Overlay should disappear
   - No element context should be added

✅ Pass / ❌ Fail: ___

---

### Test 8: Multiple Elements
1. Point at element A, add comment, send message
2. Point at element B, add comment, send message
3. **Expected**:
   - Each element should get a unique ref (@e1, @e2, etc.)
   - Each message should have correct element context

✅ Pass / ❌ Fail: ___

---

## Known Limitations (Out of Scope)
- ❌ Desktop capture (browser only)
- ❌ Multi-element selection
- ❌ Text selection
- ❌ Complex output formats

## Troubleshooting

### Button not visible
- Check that InputArea.tsx includes ElementPointerButton
- Rebuild: `npm run build`

### Overlay not appearing
- Check browser console for errors
- Verify content script is loaded (check chrome://extensions/)
- Refresh the web page

### Element not getting ref
- Check that S18 refManager is properly initialized
- Check browser console for errors in content script

### Message not including context
- Check that ELEMENT_POINTED message is being received
- Check InputArea state management
- Check formatPointedElementForChat function

## Success Criteria
All 8 tests should pass ✅

## Notes
- Element refs persist across the session
- Refs are managed by S18 refManager
- Element pointer works on any web page
- Content script must be loaded on the page
