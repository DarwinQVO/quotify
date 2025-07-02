import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Trash2, Copy, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuoteCard } from "@/components/quote-card"
import { Quote } from "@/types"
// import { exportQuotesToText } from "@/lib/quoteUtils" // Unused import
import { appendQuotesToGoogleDoc, authenticateWithGoogle } from "@/lib/googleDocs"

interface QuotesColumnProps {
  quotes: Quote[]
  selectedQuotes: Set<string>
  onToggleSelection: (quoteId: string) => void
  onDeleteQuotes: (quoteIds: string[]) => void
}

export function QuotesColumn({
  quotes,
  selectedQuotes,
  onToggleSelection,
  onDeleteQuotes
}: QuotesColumnProps) {
  const [isExporting, setIsExporting] = useState(false)

  const selectedQuotesList = quotes.filter(q => selectedQuotes.has(q.id))
  const hasSelectedQuotes = selectedQuotes.size > 0

  const handleSelectAll = () => {
    if (selectedQuotes.size === quotes.length) {
      // Deselect all
      quotes.forEach(q => onToggleSelection(q.id))
    } else {
      // Select all
      quotes.forEach(q => {
        if (!selectedQuotes.has(q.id)) {
          onToggleSelection(q.id)
        }
      })
    }
  }

  const handleCopySelected = async () => {
    // Format each quote with actual Unicode curly quotes
    const leftQuote = '\u201C'  // "
    const rightQuote = '\u201D'  // "
    
    const formattedQuotes = selectedQuotesList.map(quote => {
      return `${leftQuote}${quote.text}${rightQuote} ${quote.citation}`
    }).join('\n\n')
    
    console.log('Copying multiple quotes with Unicode:', formattedQuotes)
    
    // Copy as HTML for Google Docs with citation in blue link
    try {
      const htmlContent = selectedQuotesList.map(quote => 
        `<span>${leftQuote}${quote.text}${rightQuote} <a href="${quote.deepLink}" style="color: #1a73e8; text-decoration: none;">${quote.citation}</a></span>`
      ).join('<br><br>')
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlContent,
          'text/plain': formattedQuotes
        })
      ])
    } catch (err) {
      // Fallback to plain text
      await navigator.clipboard.writeText(formattedQuotes)
    }
  }

  const handleDeleteSelected = () => {
    const quoteIds = Array.from(selectedQuotes)
    onDeleteQuotes(quoteIds)
  }

  const handleExportToGoogleDocs = async () => {
    if (selectedQuotesList.length === 0) return

    setIsExporting(true)
    try {
      const auth = await authenticateWithGoogle()
      const documentId = prompt('Enter Google Doc ID (or leave empty to create new):')
      
      if (documentId) {
        await appendQuotesToGoogleDoc(documentId, selectedQuotesList, auth.accessToken)
      }
    } catch (error) {
      console.error('Failed to export to Google Docs:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="border-l bg-muted/20 p-4 flex flex-col h-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Quotes</h2>
          <p className="text-xs text-muted-foreground">
            {quotes.length} total • {selectedQuotes.size} selected
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {hasSelectedQuotes && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopySelected}
                title="Copy selected quotes"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDeleteSelected}
                title="Delete selected quotes"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleExportToGoogleDocs}
                disabled={isExporting}
                title="Export to Google Docs"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSelectAll}
            title={selectedQuotes.size === quotes.length ? "Deselect all" : "Select all"}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {quotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <h3 className="font-medium mb-2">No quotes yet</h3>
              <p className="text-sm">
                Select text in the transcript and click "Extract Quote" to get started
              </p>
            </motion.div>
          ) : (
            quotes.map((quote) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <QuoteCard
                  quote={quote}
                  isSelected={selectedQuotes.has(quote.id)}
                  onToggleSelection={() => onToggleSelection(quote.id)}
                  onDelete={() => onDeleteQuotes([quote.id])}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {hasSelectedQuotes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {selectedQuotes.size} quote{selectedQuotes.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopySelected}>
                Copy All
              </Button>
              <Button size="sm" onClick={handleExportToGoogleDocs} disabled={isExporting}>
                Export
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}