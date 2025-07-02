import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { SourceCard } from "@/components/source-card"
import { VideoSource } from "@/types"
import { isValidYouTubeUrl } from "@/lib/ytScraper"
import { useToast } from "@/hooks/use-toast"

interface SourcesColumnProps {
  sources: VideoSource[]
  activeSource: VideoSource | null
  onAddSource: (url: string) => void
  onSelectSource: (source: VideoSource) => void
  onUpdateSource: (id: string, updates: Partial<VideoSource>) => void
}

export function SourcesColumn({
  sources,
  activeSource,
  onAddSource,
  onSelectSource,
  onUpdateSource
}: SourcesColumnProps) {
  const [inputUrl, setInputUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleAddSource = () => {
    if (!inputUrl.trim()) return
    
    if (!isValidYouTubeUrl(inputUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      })
      return
    }
    
    onAddSource(inputUrl.trim())
    setInputUrl("")
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSource()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setInputUrl("")
    }
  }

  return (
    <div className="border-r bg-muted/20 p-4 flex flex-col h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sources</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card className="p-3">
              <input
                autoFocus
                type="url"
                placeholder="Paste YouTube URL..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSource}>
                  Add
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {sources.map((source) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
            >
              <SourceCard
                source={source}
                isActive={activeSource?.id === source.id}
                onClick={() => onSelectSource(source)}
                onUpdate={(updates) => onUpdateSource(source.id, updates)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}