#!/bin/bash
# Custom build script for Vercel monorepo deployment
# This script ensures proper build order and dependency resolution

set -e

echo "🚀 Starting Vercel build for Dashboarduz frontend..."

# Navigate to project root
cd "$(dirname "$0")/../.."
echo "📁 Current directory: $(pwd)"

# Verify package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found in root directory"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Verify Next.js is installed in web app
echo "🔍 Checking Next.js installation..."
if [ ! -f "apps/web/package.json" ]; then
  echo "❌ Error: apps/web/package.json not found"
  exit 1
fi

if ! grep -q '"next"' "apps/web/package.json"; then
  echo "❌ Error: Next.js not found in apps/web/package.json dependencies"
  exit 1
fi

echo "✅ Next.js found in dependencies"

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
echo "📁 Building in directory: $(pwd)"

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Not in web app directory"
  exit 1
fi

pnpm build

echo "✅ Build completed successfully!"