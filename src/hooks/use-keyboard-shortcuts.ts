import { useEffect } from 'react'

interface KeyboardShortcuts {
  onCommandPalette: () => void
  onCopyQuotes: () => void
  onExtractQuote?: () => void
}

export function useKeyboardShortcuts({
  onCommandPalette,
  onCopyQuotes,
  onExtractQuote
}: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey
      
      // Cmd/Ctrl + K - Command Palette
      if (cmdOrCtrl && event.key === 'k') {
        event.preventDefault()
        onCommandPalette()
        return
      }
      
      // Shift + Cmd/Ctrl + C - Copy selected quotes
      if (cmdOrCtrl && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        onCopyQuotes()
        return
      }
      
      // E - Extract quote (when text is selected)
      if (event.key === 'e' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const selection = window.getSelection()
        if (selection && selection.toString().trim() && onExtractQuote) {
          event.preventDefault()
          onExtractQuote()
          return
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCommandPalette, onCopyQuotes, onExtractQuote])
}