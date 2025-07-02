import { useState, useRef, useCallback } from "react"
import ReactPlayer from "react-player"
import { motion } from "framer-motion"
import { TranscriptPane } from "@/components/transcript-pane"
import { VideoSource, TranscriptWord, Quote } from "@/types"
import { extractVideoId } from "@/lib/ytScraper"

interface PlayerColumnProps {
  source: VideoSource | null
  transcriptWords: TranscriptWord[]
  currentTime: number
  onTimeUpdate: (time: number) => void
  onExtractQuote: (quote: Omit<Quote, 'id'>) => void
}

export function PlayerColumn({
  source,
  transcriptWords,
  currentTime,
  onTimeUpdate,
  onExtractQuote
}: PlayerColumnProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [, setDuration] = useState(0)
  const playerRef = useRef<ReactPlayer>(null)

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    // Higher precision time updates for better word sync
    const roundedTime = Math.round(state.playedSeconds * 10) / 10
    onTimeUpdate(roundedTime)
  }, [onTimeUpdate])

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, 'seconds')
      onTimeUpdate(time)
    }
  }, [onTimeUpdate])

  if (!source) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-muted-foreground"
        >
          <h3 className="text-lg font-medium mb-2">No video selected</h3>
          <p className="text-sm">Add a YouTube URL to get started</p>
        </motion.div>
      </div>
    )
  }

  const videoId = extractVideoId(source.url)
  const embedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : source.url

  return (
    <div className="flex-1 flex flex-col bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-video bg-black relative"
      >
        {source.metadata && (
          <ReactPlayer
            ref={playerRef}
            url={embedUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            controls={true}
            onProgress={handleProgress}
            progressInterval={100}
            onDuration={setDuration}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            config={{
              youtube: {
                playerVars: {
                  showinfo: 1,
                  modestbranding: 1,
                  rel: 0
                }
              }
            }}
          />
        )}
        
        {!source.metadata && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="flex-1 overflow-hidden">
        <TranscriptPane
          words={transcriptWords}
          currentTime={currentTime}
          onSeek={handleSeek}
          onExtractQuote={onExtractQuote}
          source={source}
        />
      </div>
    </div>
  )
}