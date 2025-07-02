import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VideoSource } from "@/types"
import { scrapeVideoMetadata } from "@/lib/ytScraper"
import { transcribeVideo } from "@/lib/transcribe"
import { settingsManager } from "@/lib/settings"
import { formatDuration, formatViews, cn } from "@/lib/utils"

interface SourceCardProps {
  source: VideoSource
  isActive: boolean
  onClick: () => void
  onUpdate: (updates: Partial<VideoSource>) => void
}

export function SourceCard({ source, isActive, onClick, onUpdate }: SourceCardProps) {
  useEffect(() => {
    if (source.status === 'pending') {
      processSource()
    }
  }, [source.id])

  const processSource = async () => {
    try {
      // Step 1: Scrape metadata
      onUpdate({ status: 'metadata', progress: 25 })
      const metadata = await scrapeVideoMetadata(source.url)
      onUpdate({ metadata, progress: 50 })
      
      // Step 2: Transcribe
      onUpdate({ status: 'transcribing', progress: 75 })
      const apiKey = await settingsManager.getApiKey()
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set it in Settings.')
      }
      
      const transcript = await transcribeVideo(source.url, apiKey)
      onUpdate({ 
        transcript, 
        status: 'completed', 
        progress: 100 
      })
    } catch (error) {
      onUpdate({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  const getStatusText = () => {
    switch (source.status) {
      case 'pending':
        return 'Initializing...'
      case 'metadata':
        return 'Fetching metadata...'
      case 'transcribing':
        return 'Transcribing audio...'
      case 'completed':
        return 'Ready'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }


  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary",
        source.status === 'error' && "border-red-200"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {source.metadata ? (
          <div className="space-y-2">
            <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
              {source.metadata.thumbnail ? (
                <img
                  src={source.metadata.thumbnail}
                  alt={source.metadata.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="shimmer w-full h-full" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {source.metadata.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-1">
                {source.metadata.channel}
              </p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(source.metadata.duration)}</span>
                <span>{formatViews(source.metadata.views)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="aspect-video bg-muted rounded-md shimmer" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded shimmer" />
              <div className="h-3 bg-muted rounded w-2/3 shimmer" />
            </div>
          </div>
        )}
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              source.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {getStatusText()}
            </span>
            {source.status !== 'error' && source.status !== 'completed' && (
              <span className="text-muted-foreground">{source.progress}%</span>
            )}
          </div>
          
          {source.status !== 'completed' && source.status !== 'error' && (
            <Progress 
              value={source.progress} 
              className="h-1"
            />
          )}
          
          {source.status === 'error' && source.error && (
            <p className="text-xs text-red-500 mt-1">{source.error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}