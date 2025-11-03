import React, { useState, useRef, useCallback } from 'react'
import { BarcodeFood, searchByBarcode } from '../lib/barcode-api'

interface BarcodeScannerProps {
  onFoodFound: (food: BarcodeFood) => void
  onClose: () => void
}

export default function BarcodeScanner({ onFoodFound, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = useCallback(async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)

        // Check if BarcodeDetector is available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector()
          const detectBarcodes = async () => {
            if (videoRef.current && isScanning) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current)
                if (barcodes.length > 0) {
                  const barcode = barcodes[0].rawValue
                  await handleBarcodeDetected(barcode)
                } else {
                  requestAnimationFrame(detectBarcodes)
                }
              } catch (err) {
                requestAnimationFrame(detectBarcodes)
              }
            }
          }
          detectBarcodes()
        } else {
          setError('Barcode detection not supported in this browser. Please enter barcode manually.')
        }
      }
    } catch (err) {
      setError('Camera access denied or not available. Please enter barcode manually.')
    }
  }, [isScanning])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleBarcodeDetected = async (barcode: string) => {
    setIsLoading(true)
    stopScanning()

    try {
      const food = await searchByBarcode(barcode)
      if (food) {
        onFoodFound(food)
      } else {
        setError(`No product found for barcode: ${barcode}`)
        setIsLoading(false)
      }
    } catch (err) {
      setError('Failed to search for product. Please try again.')
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualBarcode.trim()) return

    await handleBarcodeDetected(manualBarcode.trim())
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: '#1a3a2a' }}>Scan Barcode</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Camera Scanner */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '300px',
            background: '#f8f9fa',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isScanning ? 'block' : 'none'
              }}
            />
            {!isScanning && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                <p>Camera ready for scanning</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isScanning ? (
              <button
                onClick={startScanning}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#ff6b35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                📷 Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ⏹️ Stop Scanning
              </button>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div style={{
          borderTop: '1px solid #dee2e6',
          paddingTop: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1a3a2a' }}>Or Enter Barcode Manually</h4>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !manualBarcode.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: manualBarcode.trim() && !isLoading ? '#28a745' : '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: manualBarcode.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                {isLoading ? '🔍' : 'Search'}
              </button>
            </div>
          </form>

          <p style={{
            fontSize: '0.8rem',
            color: '#666',
            margin: '0.5rem 0 0 0'
          }}>
            Barcodes are usually found on the back or bottom of product packaging
          </p>
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
              <p>Searching for product...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
