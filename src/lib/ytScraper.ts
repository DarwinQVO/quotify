import { invoke } from '@tauri-apps/api/core'
import { VideoMetadata } from '@/types'

export async function scrapeVideoMetadata(url: string): Promise<VideoMetadata> {
  try {
    const metadata = await invoke<VideoMetadata>('scrape_metadata', { url })
    return metadata
  } catch (error) {
    throw new Error(`Failed to scrape metadata: ${error}`)
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
  ]
  
  return patterns.some(pattern => pattern.test(url))
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}