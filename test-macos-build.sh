#!/bin/bash

echo "🔧 Testing Quotify build for macOS..."

# Check dependencies
echo "✓ Checking dependencies..."
which rustc || (echo "❌ Rust not installed" && exit 1)
which npm || (echo "❌ npm not installed" && exit 1)

# Clean previous builds
echo "✓ Cleaning previous builds..."
rm -rf dist
rm -rf src-tauri/target

# Install dependencies
echo "✓ Installing dependencies..."
npm install

# Build frontend
echo "✓ Building frontend..."
npm run build

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Frontend build failed - dist/index.html not found"
    exit 1
fi

# Build Tauri for macOS
echo "✓ Building Tauri for macOS..."
npm run tauri build

echo "✅ Build complete!"