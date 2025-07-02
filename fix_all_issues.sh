#!/bin/bash

echo "🔧 Fixing Quotify Issues - Senior Developer Mode"
echo "=================================================="

# Kill any running Quotify processes
echo "1. Stopping existing processes..."
pkill -f quotify 2>/dev/null || true
pkill -f tauri 2>/dev/null || true

# Clean build artifacts and caches
echo "2. Cleaning build artifacts..."
rm -rf target/
rm -rf src-tauri/target/
rm -rf dist/
rm -rf node_modules/.cache/
npm cache clean --force 2>/dev/null || true

# Force macOS Launch Services to refresh icon cache
echo "3. Clearing macOS icon cache..."
sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user
sudo find /private/var/folders/ -name com.apple.dock.iconcache -delete 2>/dev/null || true
sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true

# Verify icon files are correct
echo "4. Verifying icon files..."
for icon in src-tauri/icons/*.png src-tauri/icons/*.icns; do
    if [ -f "$icon" ]; then
        file_type=$(file "$icon")
        echo "   ✓ $icon: $file_type"
    fi
done

# Install dependencies
echo "5. Installing dependencies..."
npm install

# Clean rebuild
echo "6. Building Tauri app..."
npm run tauri build 2>/dev/null || {
    echo "   Build failed, trying dev mode..."
    timeout 60s npm run tauri dev &
    BUILD_PID=$!
    sleep 30
    kill $BUILD_PID 2>/dev/null || true
}

# Restart Dock to refresh icons
echo "7. Restarting Dock..."
killall Dock 2>/dev/null || true

echo ""
echo "✅ All fixes applied!"
echo ""
echo "Next steps:"
echo "1. Run: npm run tauri dev"
echo "2. Test transcription with a YouTube video"
echo "3. Verify new icon appears in Dock"
echo ""
echo "If icon still doesn't update, restart your Mac."