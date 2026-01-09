# Troubleshooting: Documentation Not Appearing

## Issue
After creating an assessment, documentation is not visible in the Documentation tab.

## Possible Causes & Solutions

### 1. Auto-Generation is Running in Background

**Symptom:** Documentation tab shows "No documentation generated yet"

**Solution:**
- Documentation generation happens **asynchronously** after assessment creation
- It may take 10-30 seconds to generate (depending on OpenAI API response time)
- The Documentation tab **auto-refreshes every 5 seconds** to check for new documentation
- Wait a few moments and the documentation should appear automatically

**Check:**
- Look for `[Auto-Doc]` messages in server logs/console
- Check browser console for any errors

---

### 2. Generation Failed Silently

**Symptom:** Documentation never appears even after waiting

**Solution:**
1. **Check server logs** for errors:
   ```
   [Auto-Doc] Failed to auto-generate [Regulation] docs for system [id]: [error]
   ```

2. **Common errors:**
   - OpenAI API key missing or invalid
   - Rate limiting (too many requests)
   - Network issues
   - Database connection issues

3. **Manual generation:**
   - Go to Documentation tab
   - Select regulation type
   - Click "Generate Documentation" button
   - This will show any errors that occurred

---

### 3. Tab Not Switching Correctly

**Symptom:** URL has `?tab=documentation` but wrong tab is showing

**Solution:**
1. The tab switching logic reads from URL on page load
2. If you navigate directly to the URL, it should work
3. If clicking a link doesn't work, try:
   - Refresh the page
   - Manually click the "Documentation" tab

**Fix Applied:**
- Tab switching now properly reads `?tab=documentation` from URL
- Auto-refresh added to check for new documentation

---

### 4. Documentation Exists But Not Showing

**Symptom:** Documentation was generated but tab shows empty

**Solution:**
1. **Click the "Refresh" button** in the Documentation tab
2. Check browser console for fetch errors
3. Verify the system ID matches:
   - URL: `/ai-systems/[id]`
   - Documentation is linked to this system ID

---

## How Auto-Generation Works

### Flow:
1. User completes assessment → Assessment saved to database
2. API route returns success response immediately
3. **Background process starts** (non-blocking):
   - Detects regulation type
   - Gathers system data
   - Calls OpenAI to generate documentation
   - Saves to `compliance_documentation` table
4. Documentation tab auto-refreshes every 5 seconds
5. Documentation appears when ready

### Timeline:
- **Assessment save:** Instant (< 1 second)
- **Documentation generation:** 10-30 seconds (background)
- **Auto-refresh:** Every 5 seconds
- **Total wait time:** Usually 10-30 seconds

---

## Manual Steps to Generate Documentation

If auto-generation doesn't work:

1. **Navigate to Documentation tab:**
   - Go to `/ai-systems/[id]?tab=documentation`
   - Or click "Documentation" tab on AI System Detail page

2. **Select regulation type:**
   - Choose from dropdown (EU AI Act, UK AI Act, or MAS)
   - Should auto-detect if only one regulation applies

3. **Click "Generate Documentation":**
   - Button will show "Generating..." while processing
   - Success message will appear when complete
   - Documentation will appear in the list below

---

## Debugging Steps

### 1. Check Server Logs

Look for these log messages:

**Success:**
```
[Auto-Doc] Successfully generated EU AI Act documentation for system [id], version 1.0
```

**Error:**
```
[Auto-Doc] Failed to auto-generate EU AI Act docs for system [id]: [error message]
```

### 2. Check Database

Query the `compliance_documentation` table:
```sql
SELECT * FROM compliance_documentation 
WHERE ai_system_id = '[your-system-id]'
ORDER BY created_at DESC;
```

### 3. Check API Response

Test the documentation API directly:
```bash
# Get documentation
curl http://localhost:3000/api/ai-systems/[id]/documentation

# Generate documentation
curl -X POST http://localhost:3000/api/ai-systems/[id]/documentation \
  -H "Content-Type: application/json" \
  -d '{"regulation_type": "EU AI Act"}'
```

### 4. Check Browser Console

Open browser DevTools → Console tab:
- Look for fetch errors
- Check for CORS issues
- Verify API calls are being made

---

## Recent Fixes Applied

1. ✅ **Fixed dynamic import issue** - Changed from `.then()` to `setTimeout()` for better serverless compatibility
2. ✅ **Added auto-refresh** - Documentation tab now refreshes every 5 seconds
3. ✅ **Added refresh button** - Manual refresh option in UI
4. ✅ **Added info message** - Explains auto-generation process
5. ✅ **Fixed syntax errors** - Corrected missing braces in error handling

---

## Still Not Working?

If documentation still doesn't appear after:
- Waiting 30+ seconds
- Clicking refresh button
- Manually generating

**Check:**
1. OpenAI API key is set correctly
2. Database connection is working
3. RLS policies allow documentation creation
4. System ID exists in assessment tables

**Next Steps:**
- Check server logs for detailed error messages
- Try manual generation to see specific error
- Verify assessment was saved successfully
