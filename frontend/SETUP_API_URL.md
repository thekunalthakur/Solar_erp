# 🔧 API URL Configuration Guide

## Problem: "Failed to construct URL: Invalid URL" or "Network error"

This happens when `REACT_APP_API_URL` is not properly configured.

---

## ✅ Quick Fix

### For Local Development
No action needed! The frontend defaults to `http://localhost:8000`.

**Just ensure:**
- Django backend is running: `python manage.py runserver` (port 8000)
- Frontend is running: `npm start` (port 3000)

### For GitHub Codespaces

1. **Get your Codespace subdomain:**
   - In VS Code terminal, run: `hostname`
   - Or look at the forwarded port URL (remove the path)
   - Example: `localhost:8000`

2. **Update `frontend/.env`:**
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/
   ```
   Replace `amazing-space-carnival-xyz` with your actual Codespace name.

3. **Restart frontend:**
   ```bash
   npm start
   ```

---

## 🔍 Diagnose Issues

### Run diagnostic in browser console:
```javascript
import { diagnoseAPI } from './api';
diagnoseAPI();
```

This will show:
- Current `REACT_APP_API_URL` value
- API base URL being used
- Configuration status

### Browser Console Output Example:
```
✓ API Configuration loaded: {
   API_URL: "http://localhost:8000/api/",
   API_BASE_URL: "http://localhost:8000/api/"
}
```

---

## ⚠️ Common Issues

### Issue 1: "Invalid URL error"
**Cause:** `.env` has placeholder template `<codespace-name>`

**Fix:**
```bash
# ❌ Wrong
REACT_APP_API_URL=http://localhost:8000/api/

# ✅ Correct
REACT_APP_API_URL=http://localhost:8000/api/
```

### Issue 2: "Network error connecting to API"
**Cause:** Backend not running or wrong URL

**Check:**
1. Backend running? `ps aux | grep "manage.py runserver"`
2. Correct URL? Open browser to `REACT_APP_API_URL/api/leads/`
3. CORS enabled? (Should be in Django settings)

### Issue 3: Environment variables not reloading
**Cause:** Frontend needs restart after `.env` changes

**Fix:**
```bash
# Stop frontend (Ctrl+C)
# Update .env file
npm start
```

---

## 📋 .env File Reference

```env
# API Configuration
# For local development (default): http://localhost:8000
# For GitHub Codespaces: Replace with your actual Codespace URL

# Example for Codespaces:
REACT_APP_API_URL=http://localhost:8000/api/

# Example for local development:
REACT_APP_API_URL=http://localhost:8000
```

---

## 🧪 Test API Connection

### Method 1: Browser Developer Tools
```javascript
// Open browser console and run:
fetch(process.env.REACT_APP_API_URL + '/api/leads/')
  .then(r => r.json())
  .then(data => console.log('✅ Connected!', data))
  .catch(e => console.error('❌ Error:', e.message));
```

### Method 2: Use diagnoseAPI()
```javascript
import { diagnoseAPI } from './api';
const result = diagnoseAPI();
console.log(result);
```

### Method 3: Check Network Tab
1. Open Browser DevTools → Network tab
2. Load the page
3. Look for failed requests to `/api/leads/`
4. Check the request URL matches your `REACT_APP_API_URL`

---

## ✅ Verification Checklist

- [ ] `.env` file exists with valid URL
- [ ] URL does NOT contain `<` or `>` characters
- [ ] Backend running on the URL specified
- [ ] Frontend restarted after `.env` changes
- [ ] Browser Network tab shows requests to correct URL
- [ ] No 404 or CORS errors in browser console
- [ ] `diagnoseAPI()` shows correct configuration

---

## 📝 File Locations

- **Frontend config:** `frontend/.env`
- **API code:** `frontend/src/api.js`
- **Backend:** `backend/` (ensure running on port 8000)

---

## 🆘 Still Having Issues?

1. Check browser console for full error message
2. Run `diagnoseAPI()` to see current configuration
3. Verify backend is responding: `curl http://localhost:8000/api/leads/`
4. For Codespaces, double-check the URL format
