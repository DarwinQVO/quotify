#!/usr/bin/env python3
"""
Reliable audio extraction script for Quotify
Uses Python yt-dlp with proper ffmpeg configuration
"""

import sys
import os
import yt_dlp
from pathlib import Path

def extract_audio(url, output_path):
    """Extract audio from YouTube video using yt-dlp Python library"""
    
    # Configure ffmpeg paths
    ffmpeg_path = '/opt/homebrew/bin/ffmpeg'
    ffprobe_path = '/opt/homebrew/bin/ffprobe'
    
    # Verify tools exist
    if not os.path.exists(ffmpeg_path):
        raise Exception(f"ffmpeg not found at {ffmpeg_path}")
    if not os.path.exists(ffprobe_path):
        raise Exception(f"ffprobe not found at {ffprobe_path}")
    
    # Configure yt-dlp options
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': str(output_path).replace('.mp3', '.%(ext)s'),
        'ffmpeg_location': ffmpeg_path,
    }
    
    # Set environment variables
    os.environ['PATH'] = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'
    os.environ['FFMPEG_BINARY'] = ffmpeg_path
    os.environ['FFPROBE_BINARY'] = ffprobe_path
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Find the actual output file
        output_dir = Path(output_path).parent
        base_name = Path(output_path).stem
        
        for file in output_dir.glob(f"{base_name}.*"):
            if file.suffix in ['.mp3', '.m4a', '.webm']:
                # Rename to expected output path
                if str(file) != output_path:
                    file.rename(output_path)
                return str(output_path)
        
        raise Exception("Audio file was not created")
        
    except Exception as e:
        raise Exception(f"Audio extraction failed: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 extract_audio.py <youtube_url> <output_path>")
        sys.exit(1)
    
    url = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        result = extract_audio(url, output_path)
        print(f"SUCCESS: {result}")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)