# Debugging Documentation Generation

## Issue: Documentation Not Appearing After Creating Assessment

### Important Notes:

1. **Documentation is only auto-generated when:**
   - ✅ An assessment (EU/UK/MAS) is **created**
   - ✅ A risk assessment is **approved** (not just created)

2. **If you only created a risk assessment:**
   - Risk assessments start as "draft" status
   - Documentation won't generate until the risk assessment is **approved**
   - You need to submit it first, then approve it

### How to Check What's Happening:

1. **Check Server Logs:**
   Look for these log messages:
   ```
   [Auto-Doc] Starting auto-generation for EU AI Act system [id]
   [Auto-Doc] User ID: [userId]
   [Auto-Doc] Detected regulation types: EU AI Act
   [Auto-Doc] Generating EU AI Act documentation...
   [Auto-Doc] ✅ Successfully generated...
   ```

2. **Check for Errors:**
   Look for:
   ```
   [Auto-Doc] ❌ Failed to auto-generate...
   [Auto-Doc] No regulation types found...
   [Auto-Doc] No user ID found...
   ```

3. **Verify Assessment Exists:**
   - Make sure you created an **assessment** (EU/UK/MAS), not just a risk assessment
   - Risk assessments are separate from compliance assessments
   - Documentation is generated based on compliance assessments

### Steps to Generate Documentation:

**Option 1: Create a Compliance Assessment**
1. Go to Assessment page
2. Select EU AI Act, UK AI Act, or MAS
3. Complete the assessment
4. Documentation should auto-generate (check logs)

**Option 2: Approve a Risk Assessment**
1. Create a risk assessment (starts as "draft")
2. Submit it for review
3. Approve it
4. Documentation should regenerate

**Option 3: Manual Generation**
1. Go to AI System Detail page
2. Click "Documentation" tab
3. Select regulation type
4. Click "Generate Documentation"
5. This will show any errors

### Common Issues:

1. **No User ID:**
   - Error: `[Auto-Doc] No user ID found`
   - Fix: Make sure you're logged in

2. **No Regulation Type Found:**
   - Error: `[Auto-Doc] No regulation types found`
   - Fix: Make sure you created an assessment (EU/UK/MAS)

3. **OpenAI API Error:**
   - Error: `Failed to generate documentation`
   - Fix: Check OPEN_AI_KEY environment variable

4. **Database Error:**
   - Error: `Database insert error`
   - Fix: Check RLS policies and database connection

### Testing:

1. **Create a new assessment:**
   ```bash
   # Watch server logs for [Auto-Doc] messages
   ```

2. **Check database:**
   ```sql
   SELECT * FROM compliance_documentation 
   WHERE ai_system_id = '[your-system-id]'
   ORDER BY created_at DESC;
   ```

3. **Check API directly:**
   ```bash
   curl http://localhost:3000/api/ai-systems/[id]/documentation
   ```

### Recent Fixes:

1. ✅ Changed from `setTimeout` to `void()` for better serverless compatibility
2. ✅ Added comprehensive logging with `[Auto-Doc]` prefix
3. ✅ Added error stack traces
4. ✅ Added progress logging at each step

### Next Steps:

1. **Check server logs** for `[Auto-Doc]` messages
2. **Verify you created an assessment** (not just risk assessment)
3. **Try manual generation** to see specific errors
4. **Check browser console** for any frontend errors
