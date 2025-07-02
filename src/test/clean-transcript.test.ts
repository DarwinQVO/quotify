import { describe, it, expect } from 'vitest'
import { cleanTranscript, groupWordsIntoSentences } from '@/lib/cleanTranscript'
import { TranscriptWord } from '@/types'

describe('Clean Transcript', () => {
  const mockWords: TranscriptWord[] = [
    { text: 'Hello', start: 0, end: 0.5 },
    { text: 'um', start: 0.5, end: 0.7 },
    { text: 'world', start: 0.7, end: 1.2 },
    { text: 'this', start: 1.2, end: 1.5 },
    { text: 'is', start: 1.5, end: 1.7 },
    { text: 'uh', start: 1.7, end: 1.9 },
    { text: 'amazing.', start: 1.9, end: 2.5 }
  ]

  it('removes filler words', () => {
    const cleaned = cleanTranscript(mockWords)
    const texts = cleaned.map(w => w.text)
    
    expect(texts).not.toContain('um')
    expect(texts).not.toContain('uh')
    expect(texts).toContain('Hello')
    expect(texts).toContain('world')
    expect(texts).toContain('amazing.')
  })

  it('groups words into sentences', () => {
    const cleanWords = cleanTranscript(mockWords)
    const sentences = groupWordsIntoSentences(cleanWords)
    
    expect(sentences).toHaveLength(1)
    expect(sentences[0]).toHaveLength(5) // Hello, world, this, is, amazing.
  })
})