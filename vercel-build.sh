#!/bin/bash
set -e

echo "🚀 Starting Vercel build..."

# Vercel runs this from the project root
# Install dependencies using pnpm (handles workspace)
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Build the web app
echo "🏗️  Building Next.js application..."
cd apps/web
pnpm build

echo "✅ Build completed successfully!"