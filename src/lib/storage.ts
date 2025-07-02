import { invoke } from '@tauri-apps/api/core'
import { VideoSource, Quote } from '@/types'

export class AppStorage {
  // Save sources to persistent storage
  static async saveSources(sources: VideoSource[]): Promise<void> {
    try {
      await invoke('save_app_data', { 
        key: 'sources', 
        data: sources 
      })
    } catch (error) {
      console.error('Failed to save sources:', error)
    }
  }

  // Load sources from persistent storage
  static async loadSources(): Promise<VideoSource[]> {
    try {
      const data = await invoke<VideoSource[]>('load_app_data', { key: 'sources' })
      return data || []
    } catch (error) {
      console.error('Failed to load sources:', error)
      return []
    }
  }

  // Save quotes to persistent storage
  static async saveQuotes(quotes: Quote[]): Promise<void> {
    try {
      await invoke('save_app_data', { 
        key: 'quotes', 
        data: quotes 
      })
    } catch (error) {
      console.error('Failed to save quotes:', error)
    }
  }

  // Load quotes from persistent storage
  static async loadQuotes(): Promise<Quote[]> {
    try {
      const data = await invoke<Quote[]>('load_app_data', { key: 'quotes' })
      return data || []
    } catch (error) {
      console.error('Failed to load quotes:', error)
      return []
    }
  }

  // Save app settings
  static async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      await invoke('save_app_data', { 
        key: 'settings', 
        data: settings 
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Load app settings
  static async loadSettings(): Promise<Record<string, any>> {
    try {
      const data = await invoke<Record<string, any>>('load_app_data', { key: 'settings' })
      return data || {}
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    }
  }

  // Clear all app data
  static async clearAllData(): Promise<void> {
    try {
      await invoke('clear_app_data')
    } catch (error) {
      console.error('Failed to clear app data:', error)
      throw error
    }
  }
}