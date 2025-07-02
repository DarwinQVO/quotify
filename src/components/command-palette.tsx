import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Settings, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { isValidYouTubeUrl } from "@/lib/ytScraper"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onAddSource: (url: string) => void
  onOpenSettings?: () => void
}

interface Command {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

export function CommandPalette({ isOpen, onClose, onAddSource, onOpenSettings }: CommandPaletteProps) {
  const [input, setInput] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: "add-source",
      title: "Add YouTube Source",
      description: "Paste a YouTube URL to analyze",
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        if (isValidYouTubeUrl(input)) {
          onAddSource(input)
          onClose()
          setInput("")
        }
      }
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure API keys and preferences",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        onOpenSettings?.()
        onClose()
      },
      shortcut: "⌘,"
    },
    {
      id: "export",
      title: "Export All Quotes",
      description: "Export all quotes to clipboard",
      icon: <Download className="h-4 w-4" />,
      action: () => {
        // Export all quotes
        onClose()
      },
      shortcut: "⌘E"
    }
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(input.toLowerCase()) ||
    cmd.description.toLowerCase().includes(input.toLowerCase())
  )

  const isUrl = isValidYouTubeUrl(input)
  const displayCommands = isUrl ? [commands[0]] : filteredCommands

  useEffect(() => {
    if (!isOpen) {
      setInput("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % displayCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev === 0 ? displayCommands.length - 1 : prev - 1)
          break
        case 'Enter':
          e.preventDefault()
          if (displayCommands[selectedIndex]) {
            displayCommands[selectedIndex].action()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, displayCommands, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg mx-4"
        >
          <Card className="overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search commands or paste YouTube URL..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {displayCommands.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No commands found
                </div>
              ) : (
                displayCommands.map((command, index) => (
                  <motion.div
                    key={command.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={command.action}
                    whileHover={{ backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex-shrink-0">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{command.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {command.description}
                      </div>
                    </div>
                    {command.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-background border rounded">
                        {command.shortcut}
                      </kbd>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}