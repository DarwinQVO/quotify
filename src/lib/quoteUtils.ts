import { invoke } from '@tauri-apps/api/core'
import { VideoMetadata, Quote } from '@/types'

export function createCurlyQuote(text: string): string {
  return `"${text.trim()}"`
}

export function createCitation(metadata: VideoMetadata): string {
  const date = new Date(metadata.publishDate)
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  return `${metadata.channel} (${month} ${year})`
}

export async function generateDeepLink(url: string, timestamp: number): Promise<string> {
  try {
    const deepLink = await invoke<string>('generate_deep_link', { 
      url, 
      timestamp 
    })
    return deepLink
  } catch (error) {
    console.error('Failed to generate deep link:', error)
    return url
  }
}

export function createQuoteFromSelection(
  selectedText: string,
  metadata: VideoMetadata,
  timestamp: number,
  sourceId: string
): Omit<Quote, 'id'> {
  // Use proper curly quotes (Unicode characters U+201C and U+201D)
  const cleanText = selectedText.trim()
  // const curlyQuote = `"${cleanText}"` // Unused variable
  
  // Parse the publish_date properly (format: YYYYMMDD) and format as (Mon YYYY)
  let dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  
  if (metadata.publishDate && metadata.publishDate.length >= 8) {
    const year = metadata.publishDate.substring(0, 4)
    const month = metadata.publishDate.substring(4, 6)
    
    if (!isNaN(parseInt(year)) && !isNaN(parseInt(month))) {
      const date = new Date(parseInt(year), parseInt(month) - 1) // month is 0-indexed
      dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }
  
  return {
    text: cleanText, // Store text WITHOUT quotes
    citation: `${metadata.channel}, (${dateStr})`,
    deepLink: '', // Will be generated asynchronously
    timestamp,
    sourceId,
    selectedText
  }
}

export function exportQuotesToText(quotes: Quote[]): string {
  return quotes
    .map(quote => {
      // Format with proper curly quotes and embedded link
      return `"${quote.text}" ${quote.citation} ${quote.deepLink || ''}`
    })
    .join('\n\n')
}

export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}