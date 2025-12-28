#!/bin/bash

# Sanity CMS Quick Setup Script
# This script helps you set up Sanity CMS for your project

echo "🎨 Sanity CMS Setup"
echo "===================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

echo "📋 Follow these steps to set up Sanity:"
echo ""
echo "1️⃣  Create a Sanity Project"
echo "   → Go to: https://www.sanity.io/manage"
echo "   → Click 'Create project'"
echo "   → Enter project name: 'AI Chat CMS'"
echo "   → Choose dataset: 'production'"
echo "   → Copy your Project ID"
echo ""

echo "2️⃣  Get API Token"
echo "   → In Sanity dashboard: Settings → API"
echo "   → Click 'Add API token'"
echo "   → Name: 'Production API Token'"
echo "   → Permissions: Editor"
echo "   → Copy the token"
echo ""

echo "3️⃣  Generate Preview Secret"
echo "   Run: openssl rand -hex 32"
echo ""

echo "4️⃣  Update .env file"
echo "   Add these variables to .env:"
echo ""
echo "   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here"
echo "   NEXT_PUBLIC_SANITY_DATASET=production"
echo "   SANITY_API_TOKEN=your-api-token-here"
echo "   SANITY_PREVIEW_SECRET=your-preview-secret-here"
echo ""

echo "5️⃣  Configure CORS (Important!)"
echo "   → In Sanity dashboard: Settings → API → CORS Origins"
echo "   → Add: http://localhost:3000"
echo "   → Check: ✅ Allow credentials"
echo ""

echo "6️⃣  Restart your dev server"
echo "   → Stop the current server (Ctrl+C)"
echo "   → Run: npm run dev"
echo "   → Visit: http://localhost:3000/studio"
echo ""

echo "📚 Full documentation: docs/SANITY_SETUP.md"
echo ""
