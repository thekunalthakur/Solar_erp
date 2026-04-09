# 🎯 Quick Reference - API Configuration

## For Local Development
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm start

# Visit http://localhost:3000
```
✅ No `.env` changes needed - uses default localhost:8000

---

## For GitHub Codespaces

```bash
# 1. Get Codespace name (run in terminal)
echo $CODESPACE_NAME
# Output example: amazing-space-carnival-xyz

# 2. Edit frontend/.env
REACT_APP_API_URL=http://localhost:8000/api/
```

Replace `amazing-space-carnival-xyz` with your actual Codespace name.

```bash
# 3. Terminal 1 - Backend
cd backend
python manage.py runserver

# 4. Terminal 2 - Frontend
cd frontend
npm start

# 5. Visit http://localhost:3000
```

---

## Troubleshooting Commands

```bash
# Check if backend is running
curl http://localhost:8000/api/leads/

# Verify Codespace URL
echo $CODESPACE_NAME

# Test for Codespaces backend
curl http://localhost:8000/api/leads/

# Reload environment (after .env changes)
npm start
```

---

## Browser Console Diagnostics

```javascript
// Import the diagnostic function
import { diagnoseAPI } from './api';

// Run diagnostics
diagnoseAPI();

// Check console for configuration details
```

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/.env` | **EDIT THIS** for your environment |
| `frontend/src/api.js` | Centralized API client (don't edit) |
| `backend/config/settings.py` | CORS configured (already set) |

---

## ⚠️ Common Mistakes

❌ **Forgotten to update .env for Codespaces**
```env
# Wrong
REACT_APP_API_URL=http://localhost:8000/api/

# Correct  
REACT_APP_API_URL=http://localhost:8000/api/
```

❌ **Didn't restart npm after .env change**
```bash
# Always do this
npm start  # Restarts and reloads .env
```

❌ **Backend not running**
```bash
# Make sure you have TWO terminals:
# Terminal 1: python manage.py runserver
# Terminal 2: npm start
```

---

## Success Signs

✅ Browser shows leads table  
✅ No "Network error" messages  
✅ Browser DevTools → Network shows `/api/leads/` request with 200 status  
✅ Console shows: "✓ API Configuration loaded"  

---

## Need Help?

```bash
# Run verification script
cd /workspaces/Solar_erp
bash verify_setup.sh

# Read full documentation
cat CODESPACES_SETUP.md

# See all changes made
cat API_CONNECTION_FIX.md
```
