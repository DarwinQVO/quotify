import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, Eye, EyeOff, Save, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { settingsManager, AppSettings } from "@/lib/settings"
import { useTheme } from "@/components/theme-provider"
import { AppStorage } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const { setTheme } = useTheme()
  const { toast } = useToast()

  const handleClearData = async () => {
    try {
      await AppStorage.clearAllData()
      toast({
        title: "Data cleared",
        description: "All app data has been cleared. Please restart the app."
      })
      // Refresh the page to reset the app state
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear app data",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const currentSettings = await settingsManager.getSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await settingsManager.updateSetting('openaiApiKey', settings.openaiApiKey)
      await settingsManager.updateSetting('theme', settings.theme)
      await settingsManager.updateSetting('autoSave', settings.autoSave)
      await settingsManager.updateSetting('maxQuotes', settings.maxQuotes)

      // Update theme immediately
      setTheme(settings.theme)
      
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  if (!isOpen || !settings) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={settings.openaiApiKey}
                  onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required for transcription. Get yours at{" "}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  platform.openai.com
                </a>
              </p>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: AppSettings['theme']) => updateSetting('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save quotes as you create them
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            {/* Max Quotes */}
            <div className="space-y-2">
              <Label htmlFor="max-quotes">Maximum Quotes</Label>
              <Input
                id="max-quotes"
                type="number"
                min="10"
                max="1000"
                value={settings.maxQuotes}
                onChange={(e) => updateSetting('maxQuotes', parseInt(e.target.value) || 100)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of quotes to keep in memory
              </p>
            </div>

            {/* Data Management */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium text-muted-foreground">
                Data Management
              </Label>
              <p className="text-xs text-muted-foreground">
                Clear all saved sources, quotes, and settings. This action cannot be undone.
              </p>
              <Button 
                onClick={handleClearData}
                variant="destructive"
                className="w-full"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}