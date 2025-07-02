import { invoke } from '@tauri-apps/api/core'
import { TranscriptionResult } from '@/types'

export async function transcribeVideo(url: string, apiKey: string): Promise<TranscriptionResult> {
  try {
    const result = await invoke<TranscriptionResult>('transcribe_audio', { 
      url, 
      apiKey 
    })
    return result
  } catch (error) {
    throw new Error(`Failed to transcribe video: ${error}`)
  }
}