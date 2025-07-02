import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote as QuoteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoSource, TranscriptWord, Quote } from "@/types"
import { createQuoteFromSelection, generateDeepLink } from "@/lib/quoteUtils"
import { cleanTranscript, groupWordsIntoSentences } from "@/lib/cleanTranscript"
import { cn } from "@/lib/utils"

interface TranscriptPaneProps {
  words: TranscriptWord[]
  currentTime: number
  onSeek: (time: number) => void
  onExtractQuote: (quote: Omit<Quote, 'id'>) => void
  source: VideoSource
}

interface WordComponent {
  word: TranscriptWord
  isActive: boolean
  isHighlighted: boolean
  onClick: () => void
  onMouseDown: (event: React.MouseEvent) => void
  onMouseEnter: () => void
}

const Word = React.forwardRef<HTMLSpanElement, WordComponent>(
  ({ word, isActive, isHighlighted, onClick, onMouseDown, onMouseEnter }, ref) => (
    <motion.span
      ref={ref}
      className={cn(
        "cursor-pointer transition-all duration-200 px-1 py-0.5 rounded-sm select-none inline-block",
        isActive && "bg-primary text-primary-foreground",
        isHighlighted && "bg-blue-200 dark:bg-blue-800",
        "hover:bg-muted"
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={word.speaker ? `${word.speaker} - ${word.start.toFixed(1)}s` : `${word.start.toFixed(1)}s`}
    >
      {word.text}
    </motion.span>
  )
)

export function TranscriptPane({
  words,
  currentTime,
  onSeek,
  onExtractQuote,
  source
}: TranscriptPaneProps) {
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)
  const [showExtractButton, setShowExtractButton] = useState(false)
  const [extractButtonPosition, setExtractButtonPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)

  const cleanWords = cleanTranscript(words)
  const sentences = groupWordsIntoSentences(cleanWords)

  // Find active word based on current time with better precision
  const activeWordIndex = useMemo(() => {
    if (cleanWords.length === 0) return -1
    
    // Find the word that should be active at current time
    for (let i = 0; i < cleanWords.length; i++) {
      const word = cleanWords[i]
      const nextWord = cleanWords[i + 1]
      
      // Use word's actual end time, or next word's start time if available
      const effectiveEnd = nextWord ? nextWord.start : word.end
      
      if (currentTime >= word.start && currentTime < effectiveEnd) {
        return i
      }
      
      // If we're past this word but before the next, still consider it active
      if (i === cleanWords.length - 1 && currentTime >= word.start) {
        return i
      }
    }
    
    return -1
  }, [cleanWords, currentTime])

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current
      const activeElement = activeWordRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeElement.getBoundingClientRect()

      if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [activeWordIndex])

  // Click and drag selection state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)

  const handleWordMouseDown = useCallback((wordIndex: number, event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    setDragStartIndex(wordIndex)
    setSelectedRange({ start: wordIndex, end: wordIndex })
  }, [])

  const handleWordMouseEnter = useCallback((wordIndex: number) => {
    if (isDragging && dragStartIndex !== null) {
      const start = Math.min(dragStartIndex, wordIndex)
      const end = Math.max(dragStartIndex, wordIndex)
      setSelectedRange({ start, end })
    }
  }, [isDragging, dragStartIndex])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (isDragging && selectedRange) {
      const selectedWordsCount = selectedRange.end - selectedRange.start + 1
      if (selectedWordsCount >= 3) { // Minimum 3 words for a quote
        setExtractButtonPosition({
          x: event.clientX,
          y: event.clientY - 50
        })
        setShowExtractButton(true)
      } else {
        setSelectedRange(null)
      }
    }
    setIsDragging(false)
    setDragStartIndex(null)
  }, [isDragging, selectedRange])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const handleExtractQuote = async () => {
    if (!selectedRange || !source.metadata) return

    const selectedWords = cleanWords.slice(selectedRange.start, selectedRange.end + 1)
    const selectedText = selectedWords.map(w => w.text).join(' ')
    const timestamp = selectedWords[0]?.start || 0
    
    // Get the actual speaker name from the first word, not the channel
    const speakerName = selectedWords[0]?.speaker || "Unknown Speaker"

    const quote = createQuoteFromSelection(
      selectedText,
      source.metadata,
      timestamp,
      source.id
    )

    // Override citation with actual speaker name and proper date format
    let dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    if (source.metadata.publishDate && source.metadata.publishDate.length >= 8) {
      const year = source.metadata.publishDate.substring(0, 4)
      const month = source.metadata.publishDate.substring(4, 6)
      
      if (!isNaN(parseInt(year)) && !isNaN(parseInt(month))) {
        const date = new Date(parseInt(year), parseInt(month) - 1) // month is 0-indexed
        dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    }
    
    const updatedQuote = {
      ...quote,
      text: selectedText, // Store raw text without quotes
      citation: `${speakerName}, (${dateStr})`
    }

    // Generate deep link
    const deepLink = await generateDeepLink(source.url, timestamp)
    
    onExtractQuote({
      ...updatedQuote,
      deepLink
    })

    // Clear selection
    setShowExtractButton(false)
    setSelectedRange(null)
  }

  const handleWordClick = (word: TranscriptWord) => {
    if (!isDragging) {
      onSeek(word.start)
    }
  }

  if (!source.transcript) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground"
        >
          {source.status === 'transcribing' ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm">Transcribing audio...</p>
            </>
          ) : (
            <p className="text-sm">No transcript available</p>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-medium text-sm text-muted-foreground">Transcript</h3>
      </div>
      
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed"
        style={{ height: 'calc(100vh - 400px)', width: '100%' }}
      >
        {sentences.map((sentence, sentenceIndex) => {
          const firstWord = sentence[0]
          const speaker = firstWord?.speaker
          const speakerColor = speaker === "Interviewer" ? "text-blue-600 dark:text-blue-400" : 
                             speaker === "Speaker 1" ? "text-green-600 dark:text-green-400" : 
                             "text-purple-600 dark:text-purple-400"
          
          return (
            <motion.div
              key={sentenceIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sentenceIndex * 0.1 }}
              className="mb-4"
            >
              {speaker && (
                <div className={cn("text-xs font-medium mb-1", speakerColor)}>
                  {speaker}
                </div>
              )}
              <p className="mb-2 flex flex-wrap gap-1 w-full">
                {sentence.map((word, wordIndex) => {
                  const globalIndex = cleanWords.indexOf(word)
                  const isActive = globalIndex === activeWordIndex
                  const isHighlighted = selectedRange && 
                    globalIndex >= selectedRange.start && 
                    globalIndex <= selectedRange.end

                  return (
                    <Word
                      key={`${sentenceIndex}-${wordIndex}`}
                      word={word}
                      isActive={isActive}
                      isHighlighted={isHighlighted || false}
                      onClick={() => handleWordClick(word)}
                      onMouseDown={(e) => handleWordMouseDown(globalIndex, e)}
                      onMouseEnter={() => handleWordMouseEnter(globalIndex)}
                      {...(isActive ? { ref: activeWordRef } : {})}
                    />
                  )
                })}
              </p>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {showExtractButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-background border rounded-lg shadow-lg p-2"
            style={{
              left: extractButtonPosition.x - 50,
              top: extractButtonPosition.y - 50
            }}
          >
            <Button
              size="sm"
              onClick={handleExtractQuote}
              className="gap-2"
            >
              <QuoteIcon className="h-3 w-3" />
              Extract Quote
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}