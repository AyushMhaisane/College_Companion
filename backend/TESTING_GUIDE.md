# 🧪 Quick Test Script for Gemini Integration

## Test 1: Check Environment Variables

Run this in PowerShell from the backend directory:

```powershell
# Check if Gemini API key is set
$envContent = Get-Content .env
if ($envContent -match "GEMINI_API_KEY=.+") {
    Write-Host "✅ GEMINI_API_KEY is set" -ForegroundColor Green
} else {
    Write-Host "❌ GEMINI_API_KEY is missing or empty" -ForegroundColor Red
}

# Check if Perplexity keys are removed
if ($envContent -match "PPLX_") {
    Write-Host "⚠️  PPLX keys still present in .env (can be removed)" -ForegroundColor Yellow
} else {
    Write-Host "✅ No Perplexity keys found" -ForegroundColor Green
}
```

## Test 2: Start Backend and Check Logs

```powershell
cd backend
node server.js
```

**Expected Output:**
```
🚀 Initializing Backend Services...

✅ MongoDB Connected
📊 Database: test
🔗 Host: ac-7y4rabx-shard-00-01.zbssgmq.mongodb.net

✅ Firebase Admin SDK initialized
📦 Project: lmswebapp-synapslogic

✅ Gemini AI client initialized    # ← Must see this line

✅ Groq client initialized

✅ Server running on port 5000
```

**If you see:** `⚠️  GEMINI_API_KEY not configured, will use Groq as primary`
- This means Gemini key is missing, but Groq fallback will work
- Add your Gemini API key to `.env` file

## Test 3: Test AI Endpoint with cURL

### Test Survival Plan (Uses Gemini)

```powershell
# Get Firebase Auth token first from your frontend
# Then test the survival plan endpoint

$headers = @{
    "Authorization" = "Bearer YOUR_FIREBASE_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    skills = "JavaScript, React"
    stressLevel = "Medium"
    timeAvailable = "2 hours daily"
    examDates = "December 20, 2025"
    goals = "Learn full-stack development"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/survival" -Method POST -Headers $headers -Body $body
```

**Expected Console Log:**
```
✨ Calling Gemini...
✅ Gemini response received
```

**If Gemini fails (no API key or error), you'll see:**
```
✨ Calling Gemini...
⚠️  Gemini failed, switching to Groq fallback: [error message]
✅ Groq fallback response received
```

## Test 4: Test Essentials Extraction (Uses Gemini)

```powershell
# Upload a file to test essentials extraction
$filePath = "C:\path\to\your\syllabus.pdf"
$uri = "http://localhost:5000/api/essentials/extract"

# Create multipart form data
$form = @{
    file = Get-Item -Path $filePath
}

Invoke-RestMethod -Uri $uri -Method POST -Form $form -Headers @{
    "Authorization" = "Bearer YOUR_FIREBASE_TOKEN"
}
```

**Expected Console Log:**
```
📄 Processing file: syllabus.pdf (application/pdf)
✨ Calling Gemini...
✅ Gemini response received
```

## Test 5: Verify No Perplexity Calls

Search entire backend codebase:

```powershell
cd backend
Get-ChildItem -Recurse -Include *.js | Select-String "perplexity|pplx|sonar|llama-3.2.*vision" -SimpleMatch
```

**Expected Output:** Only comments should appear, no actual API calls

## Test 6: Check Package Dependencies

```powershell
cd backend
npm list @google/generative-ai
```

**Expected Output:**
```
backend@2.0.0 C:\Users\Yugendra\mernproj1\backend
└── @google/generative-ai@x.x.x
```

## Test 7: Test Fallback Behavior

### Simulate Gemini Failure:

1. Set invalid Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=invalid_key_123
   ```

2. Restart backend:
   ```powershell
   node server.js
   ```

3. Make AI request (survival plan or essentials)

**Expected Console Log:**
```
⚠️  Gemini initialization failed: [error message]
⚠️  Will use Groq as fallback for all AI operations.
✅ Groq client initialized
```

4. When making requests:
   ```
   ✨ Calling Gemini...
   ⚠️  Gemini failed, switching to Groq fallback
   ✅ Groq fallback response received
   ```

## Quick Health Check Endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

**Expected Response:**
```json
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "firebase": "initialized",
    "ai": "gemini_groq_ready"
  }
}
```

---

## ✅ All Tests Passed Checklist

- [ ] GEMINI_API_KEY is set in .env
- [ ] Backend starts without errors
- [ ] "✅ Gemini AI client initialized" appears in logs
- [ ] Survival plan endpoint works
- [ ] Essentials extraction works
- [ ] Console shows "✨ Calling Gemini..." for AI requests
- [ ] No Perplexity API calls in code (only comments)
- [ ] @google/generative-ai package is installed
- [ ] Fallback to Groq works when Gemini fails

---

## 🐛 Common Issues

### Issue: "Cannot find module '@google/generative-ai'"
**Solution:**
```powershell
cd backend
npm install @google/generative-ai
```

### Issue: "GEMINI_API_KEY not configured"
**Solution:** Add your API key to `backend/.env`:
```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### Issue: All requests use Groq (Gemini never called)
**Cause:** Gemini initialization failed
**Check:** 
1. API key is valid
2. API key has quota remaining
3. Internet connection is stable

### Issue: "Both Gemini and Groq failed"
**Cause:** Both API keys are invalid or have no quota
**Solution:** 
1. Check Gemini API key validity
2. Check Groq API key validity
3. Verify API quota on both platforms

---

## 📊 Monitoring in Production

### Key Metrics to Track:
1. **Gemini Success Rate**: How often Gemini responds successfully
2. **Groq Fallback Rate**: How often fallback is triggered
3. **Total AI Failures**: Both Gemini and Groq fail
4. **Response Times**: Compare Gemini vs Groq response times
5. **API Quota Usage**: Monitor daily quota for both providers

### Recommended Logging:
```javascript
// Add to your monitoring system
{
  timestamp: new Date(),
  provider: 'gemini' | 'groq',
  endpoint: '/api/survival',
  success: true,
  responseTime: 1234, // ms
  error: null
}
```

---

**Last Updated**: December 8, 2025
**Test Status**: ✅ Backend Running Successfully
