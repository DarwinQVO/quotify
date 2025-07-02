export interface VideoMetadata {
  title: string
  channel: string
  duration: number
  publishDate: string
  views: number
  thumbnail: string
  url: string
}

export interface TranscriptWord {
  text: string
  start: number
  end: number
  speaker?: string
}

export interface TranscriptionResult {
  words: TranscriptWord[]
  fullText: string
}

export interface VideoSource {
  id: string
  url: string
  status: 'pending' | 'metadata' | 'transcribing' | 'completed' | 'error'
  progress: number
  metadata: VideoMetadata | null
  transcript: TranscriptionResult | null
  error?: string
}

export interface Quote {
  id: string
  text: string
  citation: string
  deepLink: string
  timestamp: number
  sourceId: string
  selectedText: string
}

export interface AppSettings {
  openaiApiKey: string
  theme: 'light' | 'dark'
  autoSave: boolean
}