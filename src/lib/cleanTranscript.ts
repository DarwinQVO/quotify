import { TranscriptWord } from '@/types'

const FILLER_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'hmm', 'mm', 'mhm', 'yeah', 'like', 'you know',
  'so', 'well', 'okay', 'right', 'actually', 'basically'
])

const PAUSE_INDICATORS = /\[pause\]|\[silence\]|\.\.\./gi

export function cleanTranscript(words: TranscriptWord[]): TranscriptWord[] {
  return words
    .filter(word => {
      const cleanText = word.text.toLowerCase().trim()
      
      // Remove filler words
      if (FILLER_WORDS.has(cleanText)) {
        return false
      }
      
      // Remove pause indicators
      if (PAUSE_INDICATORS.test(word.text)) {
        return false
      }
      
      // Remove very short words (likely artifacts)
      if (cleanText.length < 2 && !/^[a-z]$/i.test(cleanText)) {
        return false
      }
      
      return true
    })
    .map(word => ({
      ...word,
      text: word.text.replace(PAUSE_INDICATORS, '').trim()
    }))
    .filter(word => word.text.length > 0)
}

export function groupWordsIntoSentences(words: TranscriptWord[]): TranscriptWord[][] {
  const sentences: TranscriptWord[][] = []
  let currentSentence: TranscriptWord[] = []
  
  for (const word of words) {
    currentSentence.push(word)
    
    // Check for sentence endings
    if (/[.!?]$/.test(word.text) || currentSentence.length >= 20) {
      if (currentSentence.length > 0) {
        sentences.push(currentSentence)
        currentSentence = []
      }
    }
  }
  
  // Add remaining words as final sentence
  if (currentSentence.length > 0) {
    sentences.push(currentSentence)
  }
  
  return sentences
}