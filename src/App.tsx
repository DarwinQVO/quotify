import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ThemeProvider } from "@/components/theme-provider"
import { SourcesColumn } from "@/components/sources-column"
import { PlayerColumn } from "@/components/player-column"
import { QuotesColumn } from "@/components/quotes-column"
import { CommandPalette } from "@/components/command-palette"
import { SettingsDialog } from "@/components/settings-dialog"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/toaster"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { VideoSource, Quote, TranscriptWord } from "@/types"
import { AppStorage } from "@/lib/storage"

function App() {
  const [sources, setSources] = useState<VideoSource[]>([])
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([])

  // Load data on app start
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [savedSources, savedQuotes] = await Promise.all([
          AppStorage.loadSources(),
          AppStorage.loadQuotes()
        ])
        
        setSources(savedSources)
        setQuotes(savedQuotes)
        
        // Set active source to first one if available
        if (savedSources.length > 0 && !activeSource) {
          setActiveSource(savedSources[0])
        }
      } catch (error) {
        console.error('Failed to load app data:', error)
      }
    }
    
    loadAppData()
  }, [])

  // Auto-save sources when they change
  useEffect(() => {
    if (sources.length > 0) {
      AppStorage.saveSources(sources)
    }
  }, [sources])

  // Auto-save quotes when they change
  useEffect(() => {
    if (quotes.length > 0) {
      AppStorage.saveQuotes(quotes)
    }
  }, [quotes])

  useKeyboardShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onCopyQuotes: () => {
      const selectedQuoteTexts = quotes
        .filter(q => selectedQuotes.has(q.id))
        .map(q => `"${q.text}" ${q.citation}`)
        .join('\n\n')
      navigator.clipboard.writeText(selectedQuoteTexts)
    }
  })

  const addSource = (url: string) => {
    const newSource: VideoSource = {
      id: Date.now().toString(),
      url,
      status: 'pending',
      progress: 0,
      metadata: null,
      transcript: null
    }
    setSources(prev => [...prev, newSource])
    
    // Auto-select first source
    if (!activeSource) {
      setActiveSource(newSource)
    }
  }

  const updateSource = (id: string, updates: Partial<VideoSource>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    if (activeSource?.id === id) {
      setActiveSource(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const addQuote = (quote: Omit<Quote, 'id'>) => {
    const newQuote: Quote = {
      ...quote,
      id: Date.now().toString()
    }
    setQuotes(prev => [...prev, newQuote])
  }

  const deleteQuotes = (quoteIds: string[]) => {
    setQuotes(prev => prev.filter(q => !quoteIds.includes(q.id)))
    setSelectedQuotes(prev => {
      const newSet = new Set(prev)
      quoteIds.forEach(id => newSet.delete(id))
      return newSet
    })
  }

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId)
      } else {
        newSet.add(quoteId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (activeSource?.transcript) {
      setTranscriptWords(activeSource.transcript.words)
    }
  }, [activeSource])

  return (
    <ThemeProvider defaultTheme="light" storageKey="quotify-theme">
      <div className="min-h-screen bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)_420px]"
        >
          <ErrorBoundary>
            <SourcesColumn
              sources={sources}
              activeSource={activeSource}
              onAddSource={addSource}
              onSelectSource={setActiveSource}
              onUpdateSource={updateSource}
            />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <PlayerColumn
              source={activeSource}
              transcriptWords={transcriptWords}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onExtractQuote={addQuote}
            />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <QuotesColumn
              quotes={quotes}
              selectedQuotes={selectedQuotes}
              onToggleSelection={toggleQuoteSelection}
              onDeleteQuotes={deleteQuotes}
            />
          </ErrorBoundary>
        </motion.div>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onAddSource={addSource}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
        
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App