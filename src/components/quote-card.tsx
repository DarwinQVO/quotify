import { useState } from "react"
import { ExternalLink, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "@/types"
import { formatTimestamp, cn } from "@/lib/utils"

interface QuoteCardProps {
  quote: Quote
  isSelected: boolean
  onToggleSelection: () => void
  onDelete: () => void
}

export function QuoteCard({ quote, isSelected, onToggleSelection, onDelete }: QuoteCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // Format with actual Unicode curly quotes
    const leftQuote = '\u201C'  // "
    const rightQuote = '\u201D'  // "
    const formattedText = `${leftQuote}${quote.text}${rightQuote} ${quote.citation} ${quote.deepLink || ''}`
    
    console.log('Copying text with Unicode quotes:', formattedText)
    
    // Copy as HTML for Google Docs with citation in blue link
    try {
      const htmlContent = `<span>${leftQuote}${quote.text}${rightQuote} <a href="${quote.deepLink}" style="color: #1a73e8; text-decoration: none;">${quote.citation}</a></span>`
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlContent,
          'text/plain': `${leftQuote}${quote.text}${rightQuote} ${quote.citation}`
        })
      ])
    } catch (err) {
      // Fallback to plain text
      await navigator.clipboard.writeText(`${leftQuote}${quote.text}${rightQuote} ${quote.citation}`)
    }
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenLink = () => {
    if (quote.deepLink) {
      window.open(quote.deepLink, '_blank')
    }
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={onToggleSelection}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Quote text */}
          <blockquote className="text-sm leading-relaxed italic border-l-2 border-muted pl-3">
            "{quote.text}"
          </blockquote>
          
          {/* Citation */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{quote.citation}</span>
              <span>{formatTimestamp(quote.timestamp)}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy()
                }}
                className="h-6 w-6"
                title="Copy quote"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenLink()
                }}
                className="h-6 w-6"
                title="Open video at timestamp"
                disabled={!quote.deepLink}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="h-6 w-6 text-red-500 hover:text-red-600"
              title="Delete quote"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}