# Quotify Installation Guide

## Prerequisites

### 1. Install yt-dlp
Quotify uses yt-dlp to download YouTube audio for transcription.

**macOS (with Homebrew):**
```bash
brew install yt-dlp
```

**macOS (with pip):**
```bash
pip3 install yt-dlp
```

**Windows:**
- Download from: https://github.com/yt-dlp/yt-dlp/releases
- Add to PATH or place in app directory

**Linux:**
```bash
pip3 install yt-dlp
# or
sudo apt install yt-dlp  # Ubuntu/Debian
```

### 2. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and save it securely

## Installation

### Option 1: Download Release (Recommended)
1. Go to [Releases](https://github.com/research-quotes/Quotify/releases)
2. Download the latest version for your OS
3. Install the app

### Option 2: Build from Source

**Requirements:**
- Node.js 20+
- Rust 1.79+
- Git

**Steps:**
```bash
# Clone the repository
git clone https://github.com/research-quotes/Quotify.git
cd Quotify

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## First Time Setup

1. **Launch Quotify**
2. **Set API Key:**
   - Press `Cmd/Ctrl + K` to open command palette
   - Select "Settings"
   - Enter your OpenAI API key
   - Click "Save"

3. **Test Installation:**
   - Click the `+` button or use `Cmd/Ctrl + K`
   - Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   - Wait for processing to complete

## Verification

✅ **Check yt-dlp installation:**
```bash
yt-dlp --version
```

✅ **Test with sample URL:**
- Use any public YouTube video
- Should show: Metadata → Transcribing → Completed

## Troubleshooting

### "yt-dlp not found"
- Ensure yt-dlp is installed and in PATH
- Try absolute path: `/usr/local/bin/yt-dlp --version`

### "OpenAI API error"
- Check API key is valid
- Ensure you have API credits
- Try a shorter video first

### "Failed to download audio"
- Check internet connection
- Try a different YouTube video
- Some videos may be geo-restricted

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Rust cache
cd src-tauri
cargo clean
cd ..
```

## Features Overview

- **Three-column interface**: Sources | Player | Quotes
- **Auto-transcription**: Powered by OpenAI Whisper
- **Word-level sync**: Live transcript highlighting
- **Quote extraction**: Select text → formatted citations
- **Deep links**: Timestamp links to exact moments
- **Export**: Copy or send to Google Docs
- **Keyboard shortcuts**: `Cmd/Ctrl+K`, `E`, `Shift+Cmd/Ctrl+C`

## Support

- **Issues**: [GitHub Issues](https://github.com/research-quotes/Quotify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/research-quotes/Quotify/discussions)

---

**Ready to extract perfectly cited quotes!** 🎯