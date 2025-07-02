import { invoke } from '@tauri-apps/api/core'

export interface AppSettings {
  openaiApiKey: string
  theme: 'light' | 'dark' | 'system'
  autoSave: boolean
  maxQuotes: number
}

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: '',
  theme: 'system',
  autoSave: true,
  maxQuotes: 100
}

class SettingsManager {
  private cache: AppSettings | null = null

  async getSettings(): Promise<AppSettings> {
    if (this.cache) {
      return this.cache
    }

    try {
      // Try to get from Tauri store first
      const openaiApiKey = await invoke<string | null>('get_setting', { key: 'openai_api_key' })
      const theme = await invoke<string | null>('get_setting', { key: 'theme' })
      const autoSave = await invoke<string | null>('get_setting', { key: 'auto_save' })
      const maxQuotes = await invoke<string | null>('get_setting', { key: 'max_quotes' })

      this.cache = {
        openaiApiKey: openaiApiKey || this.getFromLocalStorage('openai_api_key') || DEFAULT_SETTINGS.openaiApiKey,
        theme: (theme || this.getFromLocalStorage('theme') || DEFAULT_SETTINGS.theme) as AppSettings['theme'],
        autoSave: this.parseBool(autoSave || this.getFromLocalStorage('auto_save')) ?? DEFAULT_SETTINGS.autoSave,
        maxQuotes: parseInt(maxQuotes || this.getFromLocalStorage('max_quotes') || String(DEFAULT_SETTINGS.maxQuotes))
      }
    } catch (error) {
      console.warn('Failed to load settings from Tauri store, using localStorage:', error)
      this.cache = this.getFromLocalStorageAll()
    }

    return this.cache
  }

  async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    try {
      // Save to Tauri store
      await invoke('save_setting', { 
        key: key.replace(/([A-Z])/g, '_$1').toLowerCase(), 
        value: String(value) 
      })
    } catch (error) {
      console.warn('Failed to save setting to Tauri store, using localStorage:', error)
    }

    // Always save to localStorage as backup
    localStorage.setItem(`quotify_${key}`, String(value))
    
    // Update cache
    if (this.cache) {
      this.cache[key] = value
    }
  }

  async getApiKey(): Promise<string> {
    const settings = await this.getSettings()
    return settings.openaiApiKey
  }

  async setApiKey(apiKey: string): Promise<void> {
    await this.updateSetting('openaiApiKey', apiKey)
  }

  private getFromLocalStorage(key: string): string | null {
    return localStorage.getItem(`quotify_${key}`)
  }

  private getFromLocalStorageAll(): AppSettings {
    return {
      openaiApiKey: this.getFromLocalStorage('openaiApiKey') || DEFAULT_SETTINGS.openaiApiKey,
      theme: (this.getFromLocalStorage('theme') as AppSettings['theme']) || DEFAULT_SETTINGS.theme,
      autoSave: this.parseBool(this.getFromLocalStorage('autoSave')) ?? DEFAULT_SETTINGS.autoSave,
      maxQuotes: parseInt(this.getFromLocalStorage('maxQuotes') || String(DEFAULT_SETTINGS.maxQuotes))
    }
  }

  private parseBool(value: string | null): boolean | null {
    if (value === null) return null
    return value === 'true'
  }

  clearCache(): void {
    this.cache = null
  }
}

export const settingsManager = new SettingsManager()