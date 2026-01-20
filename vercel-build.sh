#!/bin/bash
set -e

echo "🚀 Starting Vercel build..."

# Check if lock file exists
if [ -f "pnpm-lock.yaml" ]; then
  echo "📦 Found existing pnpm-lock.yaml"
else
  echo "📦 No pnpm-lock.yaml found - pnpm will generate one"
fi

# Vercel runs this from the project root
# Install dependencies ONLY for the web app to avoid workspace complexity
# Use --filter to only install web app dependencies
echo "📦 Installing dependencies for web app only..."
pnpm install --filter @dashboarduz/web --no-frozen-lockfile

# Build the web app
echo "🏗️  Building Next.js application..."
cd apps/web
pnpm build

echo "✅ Build completed successfully!"