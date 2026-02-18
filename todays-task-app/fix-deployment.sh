#!/bin/bash

# Fix script for Today's Task App deployment issues

echo "🔧 Fixing Today's Task App for deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "📦 Cleaning old dependencies..."
rm -rf node_modules package-lock.json

echo "📥 Installing dependencies..."
npm install

echo "🧹 Cleaning TypeScript cache..."
rm -rf node_modules/.tmp

echo "🔨 Attempting build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Your app is ready to deploy."
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Fix dependencies for deployment'"
    echo "3. git push origin main"
    echo "4. Deploy to Vercel"
    echo ""
    echo "Don't forget to add environment variables in Vercel:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
else
    echo "❌ Build failed. Check the errors above."
    echo ""
    echo "Common fixes:"
    echo "1. Make sure package.json has all dependencies"
    echo "2. Check that .env file exists (but is NOT committed)"
    echo "3. Run 'npm install' again"
    exit 1
fi
