#!/bin/bash

echo "=== QUOTIFY DIAGNOSTIC REPORT ==="
echo "Generated: $(date)"
echo

echo "1. SYSTEM INFORMATION:"
echo "   macOS Version: $(sw_vers -productVersion)"
echo "   Architecture: $(uname -m)"
echo

echo "2. EXTERNAL TOOLS:"
for tool in yt-dlp ffmpeg ffprobe; do
    if command -v "/opt/homebrew/bin/$tool" &> /dev/null; then
        version=$(/opt/homebrew/bin/$tool --version 2>/dev/null | head -1 | cut -d' ' -f1-2)
        echo "   ✅ $tool: $version"
    else
        echo "   ❌ $tool: NOT FOUND"
    fi
done
echo

echo "3. ICON FILES:"
if [ -d "src-tauri/icons" ]; then
    echo "   Icon directory exists:"
    ls -la src-tauri/icons/ | grep -E '\.(png|ico|icns)$' | while read line; do
        echo "   📁 $line"
    done
else
    echo "   ❌ Icon directory missing"
fi
echo

echo "4. BUILD ARTIFACTS:"
if [ -d "src-tauri/target" ]; then
    echo "   Build target exists"
    if [ -d "src-tauri/target/release" ]; then
        echo "   ✅ Release build directory present"
    else
        echo "   ⚠️  No release build found"
    fi
    
    # Look for built applications
    apps=$(find src-tauri/target -name "*.app" 2>/dev/null)
    if [ -n "$apps" ]; then
        echo "   📱 Built applications:"
        echo "$apps" | sed 's/^/      /'
    else
        echo "   ⚠️  No .app bundles found"
    fi
else
    echo "   ⚠️  No build target directory"
fi
echo

echo "5. TAURI CONFIGURATION:"
if [ -f "src-tauri/tauri.conf.json" ]; then
    echo "   ✅ Tauri config exists"
    
    # Check if icons are properly configured
    icon_count=$(grep -c '"icons/.*\.(png\|ico\|icns)"' src-tauri/tauri.conf.json)
    echo "   📊 Icons configured: $icon_count"
else
    echo "   ❌ Tauri config missing"
fi
echo

echo "6. NODE/NPM ENVIRONMENT:"
echo "   Node: $(node --version)"
echo "   NPM: $(npm --version)"
if [ -f "package.json" ]; then
    echo "   ✅ package.json exists"
else
    echo "   ❌ package.json missing"
fi
echo

echo "7. RUNNING PROCESSES:"
processes=$(ps aux | grep -E "(quotify|Quotify)" | grep -v grep | wc -l)
if [ $processes -gt 0 ]; then
    echo "   ⚠️  $processes Quotify processes running"
    ps aux | grep -E "(quotify|Quotify)" | grep -v grep | sed 's/^/      /'
else
    echo "   ✅ No Quotify processes running"
fi
echo

echo "8. QUICK TEST:"
echo "   Testing yt-dlp functionality..."
if /opt/homebrew/bin/yt-dlp --dump-json --no-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" >/dev/null 2>&1; then
    echo "   ✅ yt-dlp working correctly"
else
    echo "   ❌ yt-dlp test failed"
fi

echo
echo "=== END DIAGNOSTIC ==="