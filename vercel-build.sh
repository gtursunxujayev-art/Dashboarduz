#!/bin/bash
set -e

echo "🚀 Starting Vercel build..."

# Vercel runs this from the project root
# Install dependencies using pnpm (handles workspace)
# Use --no-frozen-lockfile to allow lockfile updates in CI
echo "📦 Installing dependencies with pnpm..."
pnpm install --no-frozen-lockfile

# Build the web app
echo "🏗️  Building Next.js application..."
cd apps/web
pnpm build

echo "✅ Build completed successfully!"