#!/bin/bash

# Quotify yt-dlp wrapper script
# Ensures ffmpeg and ffprobe are found correctly

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export FFMPEG_BINARY="/opt/homebrew/bin/ffmpeg"
export FFPROBE_BINARY="/opt/homebrew/bin/ffprobe"

# Verify tools exist
if [ ! -f "$FFMPEG_BINARY" ]; then
    echo "ERROR: ffmpeg not found at $FFMPEG_BINARY" >&2
    exit 1
fi

if [ ! -f "$FFPROBE_BINARY" ]; then
    echo "ERROR: ffprobe not found at $FFPROBE_BINARY" >&2
    exit 1
fi

# Execute yt-dlp with all arguments
exec /opt/homebrew/bin/yt-dlp "$@"