#!/bin/bash
set -e

echo "🚀 Starting Vercel build..."

# Vercel runs this from the project root
# First, install dependencies in the web app directory
echo "📦 Installing dependencies in apps/web..."
cd apps/web
npm install

echo "🏗️  Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"