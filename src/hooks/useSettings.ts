import { useState, useCallback } from 'react'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const STORAGE_KEY = 'hcd-settings'

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    // Deep merge with defaults so new fields are always present
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      formFields: { ...DEFAULT_SETTINGS.formFields, ...parsed.formFields },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, updateSettings, resetSettings }
}
