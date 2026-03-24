#!/bin/bash
# Azure Setup Helper - Run this to verify your environment is set up correctly

echo "=== Checking Azure Environment Variables ==="
echo ""

# Check frontend environment
cd "$(dirname "$0")/frontend" 2>/dev/null || cd "frontend" 2>/dev/null

if [ ! -f ".env.local" ]; then
    echo "❌ Missing .env.local file in frontend directory"
    echo "✅ Creating .env.local from template..."
    cp .env.local.example .env.local 2>/dev/null || echo "⚠️  Could not copy .env.local.example"
    echo ""
    echo "📝 Please edit .env.local and fill in your Azure credentials:"
    echo "   - AZURE_STORAGE_CONNECTION_STRING"
    echo "   - AZURE_STORAGE_ACCOUNT_NAME"
    echo "   - AZURE_STORAGE_ACCOUNT_KEY"
else
    echo "✅ Found .env.local file"
fi

echo ""
echo "=== Required Environment Variables ==="
echo ""
echo "The following must be set in frontend/.env.local:"
echo "  1. AZURE_STORAGE_CONNECTION_STRING"
echo "  2. AZURE_STORAGE_ACCOUNT_NAME"
echo "  3. AZURE_STORAGE_ACCOUNT_KEY"
echo "  4. AZURE_CONTAINER_NAME (default: resumes)"
echo ""
echo "=== How to Get These Values ==="
echo ""
echo "1. Go to Azure Portal → Storage Accounts → Your Storage Account"
echo ""
echo "2. For AZURE_STORAGE_CONNECTION_STRING:"
echo "   • Click: Security + networking → Access keys"
echo "   • Copy: Connection string"
echo ""
echo "3. For AZURE_STORAGE_ACCOUNT_NAME:"
echo "   • Go to: Overview"
echo "   • Copy: Storage account name"
echo ""
echo "4. For AZURE_STORAGE_ACCOUNT_KEY:"
echo "   • Click: Security + networking → Access keys"
echo "   • Copy: Key (key1 or key2)"
echo ""
echo "5. For AZURE_CONTAINER_NAME:"
echo "   • Should be: 'resumes' (or whatever you named your container)"
echo ""
echo "=== After Setting Environment Variables ==="
echo ""
echo "1. Stop the Next.js dev server (Ctrl+C)"
echo "2. Restart it: npm run dev"
echo "3. Try uploading a file"
echo ""
