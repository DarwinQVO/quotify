import { describe, it, expect } from 'vitest'
import { createCurlyQuote, createCitation, formatTimestamp } from '@/lib/quoteUtils'
import { VideoMetadata } from '@/types'

describe('Quote Utils', () => {
  const mockMetadata: VideoMetadata = {
    title: 'Test Video',
    channel: 'Test Channel',
    duration: 300,
    publishDate: '2024-01-15',
    views: 1000,
    thumbnail: 'https://example.com/thumb.jpg',
    url: 'https://youtube.com/watch?v=test'
  }

  it('creates curly quotes correctly', () => {
    expect(createCurlyQuote('Hello world')).toBe('"Hello world"')
    expect(createCurlyQuote('  spaced text  ')).toBe('"spaced text"')
  })

  it('creates citation correctly', () => {
    const citation = createCitation(mockMetadata)
    expect(citation).toBe('Test Channel (Jan 2024)')
  })

  it('formats timestamp correctly', () => {
    expect(formatTimestamp(65)).toBe('1:05')
    expect(formatTimestamp(3665)).toBe('61:05')
    expect(formatTimestamp(30)).toBe('0:30')
  })
})