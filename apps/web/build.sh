#!/bin/bash
set -e

echo "🚀 Building Next.js application..."
# Run next build directly, bypassing npm run build
./node_modules/.bin/next build

echo "✅ Build completed successfully!"