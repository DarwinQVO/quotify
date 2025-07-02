# Setup Instructions

## Prerequisites

1. **Install yt-dlp**:
```bash
pip install yt-dlp
# or
brew install yt-dlp
```

2. **Get OpenAI API Key**:
- Go to https://platform.openai.com/api-keys
- Create new key
- Save it securely

## Quick Start

1. **Install dependencies**:
```bash
cd quotify
npm install
```

2. **Fix Rust dependencies** (replace in `src-tauri/Cargo.toml`):
```toml
[dependencies]
tauri = { version = "2.0.0-beta", features = ["macos-private-api"] }
tauri-plugin-updater = "2.0.0-beta"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "multipart"] }
# Remove youtube-dl line - we'll use yt-dlp process instead
```

3. **Run the app**:
```bash
npm run tauri dev
```

4. **First time setup**:
- Open Command Palette (Cmd/Ctrl+K)
- Go to Settings
- Enter your OpenAI API key

## Known Issues

- Google Docs export needs real OAuth setup
- Icons are placeholders (run `tauri icon` to generate real ones)
- Some error states need refinement

## Production Build

```bash
npm run tauri build
```