#!/bin/bash
# 🔍 Verify Solar ERP Setup
# Run this script to test if your frontend and backend are properly connected

echo "==========================================="
echo "  🔍 Solar ERP Setup Verification"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/.env" ]; then
    echo "❌ Error: Run this script from the Solar_erp root directory"
    echo "   cd /workspaces/Solar_erp && bash verify_setup.sh"
    exit 1
fi

# Read the API URL from .env
API_URL=$(grep "REACT_APP_API_URL" frontend/.env | cut -d '=' -f2)

echo "📋 Configuration:"
echo "  API URL: $API_URL"
echo ""

# Check if API URL is localhost
if [[ "$API_URL" == "http://localhost:8000" ]]; then
    echo "✓ Using local development configuration"
    EXPECTED_BACKEND="http://localhost:8000"
else
    echo "✓ Using Codespaces configuration"
    EXPECTED_BACKEND="$API_URL"
fi

echo ""
echo "🔗 Connectivity Checks:"
echo ""

# Check backend
echo "Checking backend connection to: $EXPECTED_BACKEND"
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$EXPECTED_BACKEND/api/leads/" 2>/dev/null)

if [ "$BACKEND_CHECK" == "200" ]; then
    echo "  ✅ Backend is running and responding"
else
    echo "  ❌ Backend not responding (HTTP $BACKEND_CHECK)"
    echo "     Make sure: python manage.py runserver is running"
    echo "     On port: 8000"
fi

echo ""
echo "📁 File Checks:"
echo ""

# Check frontend files
if [ -f "frontend/src/api.js" ]; then
    echo "  ✅ frontend/src/api.js exists"
else
    echo "  ❌ frontend/src/api.js missing"
fi

if [ -f "frontend/.env" ]; then
    echo "  ✅ frontend/.env exists"
    # Check if .env has placeholder
    if grep -q "<codespace-name>" frontend/.env; then
        echo "  ⚠️  WARNING: .env contains template placeholder <codespace-name>"
        echo "       Update with actual Codespace name!"
    fi
else
    echo "  ❌ frontend/.env missing"
fi

if ! grep -q '"proxy"' frontend/package.json; then
    echo "  ✅ package.json proxy removed (uses environment variables)"
else
    echo "  ⚠️  WARNING: package.json still has proxy setting"
fi

echo ""
echo "📦 npm Packages:"
npm --version >/dev/null 2>&1 && echo "  ✅ npm installed" || echo "  ❌ npm not found"
node --version 2>/dev/null | grep -q "v" && echo "  ✅ node installed" || echo "  ❌ node not found"

echo ""
echo "============================================"
echo "  ✅ Verification Complete"
echo "============================================"
echo ""
echo "📝 Next Steps:"
echo "  1. Backend:  cd backend && python manage.py runserver"
echo "  2. Frontend: cd frontend && npm start"
echo "  3. Open: http://localhost:3000"
echo ""
echo "💡 For local setup:"
echo "  1. Ensure backend is running on http://localhost:8000"
echo "  2. Set frontend/.env to: REACT_APP_API_URL=http://localhost:8000/api/"
echo "  3. Restart frontend: npm start"
echo ""
