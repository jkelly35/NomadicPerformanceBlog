'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show the install prompt
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      // Hide the install prompt
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Reset the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg border border-stone-200 p-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-stone-800 mb-1">Install Nomadic Performance</h3>
          <p className="text-sm text-stone-600 mb-3">
            Get the full app experience with offline access and quick loading.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="text-stone-500 px-4 py-2 rounded-md text-sm font-medium hover:text-stone-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-600 ml-2"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
