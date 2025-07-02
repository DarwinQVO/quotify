#!/bin/bash
echo "=== FIXING QUOTIFY ICON ISSUE ==="

# 1. Clean all build artifacts
echo "1. Cleaning build artifacts..."
cd /Users/darwinborges/quotify
rm -rf dist/
rm -rf node_modules/.vite
rm -rf src-tauri/target/
rm -rf src-tauri/gen/

# 2. Reset macOS Launch Services database
echo "2. Resetting macOS Launch Services..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# 3. Clear icon cache
echo "3. Clearing icon cache..."
sudo rm -rf /Library/Caches/com.apple.iconservices.store
rm -rf ~/Library/Caches/com.apple.iconservices.store

# 4. Rebuild everything
echo "4. Rebuilding project..."
npm install
npm run build

# 5. Build Tauri app with fresh start
echo "5. Building Tauri app..."
npm run tauri build

echo "=== ICON FIX COMPLETE ==="
echo "Restart your Mac for icon changes to take full effect."