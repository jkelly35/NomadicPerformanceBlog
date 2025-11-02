'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase'
import { UserPreferences } from '@/types/global'

interface PreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (newPreferences: UserPreferences) => Promise<void>
  loading: boolean
}

const defaultPreferences: UserPreferences = {
  dashboards: {
    main: true,
    nutrition: true,
    training: true,
    activities: true,
    equipment: true
  }
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [loadedFromMetadata, setLoadedFromMetadata] = useState(false)
  const supabase = createClient()

  const updatePreferences = async (newPreferences: UserPreferences) => {
    if (!user) return

    try {
      // Ensure we create a completely new object
      const freshPreferences = JSON.parse(JSON.stringify(newPreferences))
      setPreferences(freshPreferences)

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          preferences: freshPreferences
        }
      })

      if (error) {
        console.error('Error updating preferences:', error)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  useEffect(() => {
    if (user && !loadedFromMetadata) {
      // Load preferences from user metadata only once
      const userPreferences = user.user_metadata?.preferences as UserPreferences | undefined
      if (userPreferences) {
        // Merge existing preferences with defaults to ensure new properties are included
        const mergedPreferences = {
          ...defaultPreferences,
          ...userPreferences,
          dashboards: {
            ...defaultPreferences.dashboards,
            ...userPreferences.dashboards
          }
        }
        setPreferences(mergedPreferences)
      } else {
        // If no preferences exist, set defaults
        setPreferences(defaultPreferences)
        // Save them to user metadata
        updatePreferences(defaultPreferences)
      }
      setLoadedFromMetadata(true)
    } else if (!user) {
      // If no user, use defaults
      setPreferences(defaultPreferences)
      setLoadedFromMetadata(false)
    }
    setLoading(false)
  }, [user, loadedFromMetadata])

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
