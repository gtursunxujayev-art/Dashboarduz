#!/bin/bash
# Custom build script for Vercel monorepo deployment
# This script ensures proper build order and dependency resolution

set -e

echo "🚀 Starting Vercel build for Dashboarduz frontend..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client if needed (for shared types)
if [ -d "packages/db" ]; then
  echo "🔧 Generating Prisma client..."
  pnpm --filter db generate || echo "⚠️  Prisma generation skipped (not critical for frontend)"
fi

# Build shared packages first
if [ -d "packages/shared" ]; then
  echo "📚 Building shared packages..."
  pnpm --filter shared build || echo "⚠️  Shared package build skipped"
fi

# Build the web app
echo "🏗️  Building Next.js application..."
cd apps/web
pnpm build

echo "✅ Build completed successfully!"