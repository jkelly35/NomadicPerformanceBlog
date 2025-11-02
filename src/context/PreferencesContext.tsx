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

      // Save to user_preferences table
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: freshPreferences
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating preferences:', error)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  useEffect(() => {
    if (user && !loadedFromMetadata) {
      // Load preferences from database
      const loadPreferences = async () => {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading preferences:', error);
          }

          if (data?.preferences) {
            // Merge existing preferences with defaults to ensure new properties are included
            const userPreferences = data.preferences as UserPreferences;
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
            // Save them to database
            updatePreferences(defaultPreferences)
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          setPreferences(defaultPreferences);
        }
        setLoadedFromMetadata(true);
        setLoading(false);
      };

      loadPreferences();
    } else if (!user) {
      // If no user, use defaults
      setPreferences(defaultPreferences)
      setLoadedFromMetadata(false)
      setLoading(false);
    }
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
