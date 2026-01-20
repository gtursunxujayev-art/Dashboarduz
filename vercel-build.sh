#!/bin/bash
set -e

echo "🚀 Starting Vercel build..."

# First, install dependencies for shared package so it can be linked
echo "📦 Setting up shared package..."
cd packages/shared
npm install --legacy-peer-deps

# Now install and build the web app
echo "📦 Installing dependencies for web app..."
cd ../../apps/web
npm install --legacy-peer-deps

# Build the web app
echo "🏗️  Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"