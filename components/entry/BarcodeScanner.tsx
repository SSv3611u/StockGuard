'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Loader2, ScanLine, Camera, CheckCircle2, X, Package } from 'lucide-react'

interface Props {
  shopId: string
  defaultMode?: 'add' | 'sell'
  disableScanner?: boolean
  forceScan?: boolean
  onSuccess?: () => void
}

interface ScannedProduct {
  barcode: string
  productName: string
  brand: string | null
  category: string | null
  imageUrl: string | null
}

export default function BarcodeScanner({
  shopId,
  defaultMode = 'add',
  disableScanner = false,
  forceScan = false,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<'add' | 'sell'>(defaultMode)
  const [step, setStep] = useState<'idle' | 'scanning' | 'loading' | 'form' | 'success'>('idle')
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null)
  const [productName, setProductName] = useState('')
  const [form, setForm] = useState({ batchNumber: '', expiryDate: '', quantity: '1', purchasePrice: '', distributorName: '' })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = useRef(`reader-${Math.random().toString(36).slice(2)}`)

  // Auto-start scanner if forceScan is true
  useEffect(() => {
    if (forceScan && !disableScanner) {
      startScanner()
    }
    return () => { cleanupScanner() }
  }, [])

  // If disableScanner, go straight to form for manual entry
  useEffect(() => {
    if (disableScanner) {
      setStep('form')
    }
  }, [disableScanner])

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try { scannerRef.current?.clear() } catch {}
          scannerRef.current = null
        })
      } else {
        try { scannerRef.current.clear() } catch {}
        scannerRef.current = null
      }
    }
  }, [])

  const startScanner = useCallback(async () => {
    setErrorMsg('')
    setStep('scanning')

    // Small delay to let the div render
    await new Promise(r => setTimeout(r, 100))

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId.current)
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          // Barcode detected! Stop scanning and lookup
          cleanupScanner()
          setStep('loading')
          await lookupProduct(decodedText)
        },
        () => {} // Ignore scan failure frames
      )
    } catch (err) {
      console.error('Scanner start error:', err)
      setErrorMsg('Could not access camera. Please check permissions.')
      setStep('idle')
    }
  }, [cleanupScanner])

  const stopScanning = useCallback(() => {
    cleanupScanner()
    setStep('idle')
  }, [cleanupScanner])

  const lookupProduct = async (barcode: string) => {
    try {
      const res = await fetch(`/api/barcode?code=${barcode}`)
      const data = await res.json()

      if (data.productName) {
        setScannedProduct({
          barcode,
          productName: data.productName,
          brand: data.brand || null,
          category: data.category || null,
          imageUrl: data.imageUrl || null,
        })
        setProductName(data.productName)
        setStep('form')
      } else {
        setScannedProduct({ barcode, productName: '', brand: null, category: null, imageUrl: null })
        setProductName('')
        setErrorMsg(`No product found for barcode: ${barcode}. Enter details manually.`)
        setStep('form')
      }
    } catch {
      setErrorMsg('Failed to lookup barcode. Please try again.')
      setStep('idle')
    }
  }

  const handleSubmit = async () => {
    if (!productName.trim()) {
      setErrorMsg('Product name is required')
      return
    }
    setLoading(true)
    setErrorMsg('')

    try {
      if (mode === 'add') {
        if (!form.expiryDate) {
          setErrorMsg('Expiry date is required')
          setLoading(false)
          return
        }
        const res = await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId,
            productName,
            batchNumber: form.batchNumber || undefined,
            expiryDate: form.expiryDate,
            quantity: parseInt(form.quantity) || 1,
            purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
            distributorName: form.distributorName || undefined,
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to add stock')
        }
      } else {
        const res = await fetch('/api/remove-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId,
            productName,
            quantity: parseInt(form.quantity) || 1,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to remove stock')
      }

      setStep('success')
      setTimeout(() => {
        resetForm()
        if (onSuccess) onSuccess()
        else window.location.reload()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setScannedProduct(null)
    setProductName('')
    setForm({ batchNumber: '', expiryDate: '', quantity: '1', purchasePrice: '', distributorName: '' })
    setErrorMsg('')
    setStep('idle')
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-4">
      {/* Mode Toggle (when scanner not disabled and not forced) */}
      {!disableScanner && !forceScan && (
        <div className="flex w-full bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'add' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setMode('add'); setErrorMsg('') }}
          >
            Add Stock
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'sell' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setMode('sell'); setErrorMsg('') }}
          >
            Sell Stock
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="w-full bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center font-medium flex items-center justify-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* STEP: IDLE — Show scan button */}
      {step === 'idle' && (
        <button
          onClick={startScanner}
          className={`w-full text-white py-4 rounded-xl font-semibold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg ${mode === 'add' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'}`}
        >
          <Camera className="w-6 h-6" />
          {mode === 'add' ? 'Scan Product to Add' : 'Scan Product to Sell'}
        </button>
      )}

      {/* STEP: SCANNING — Camera view */}
      {step === 'scanning' && (
        <div className="relative w-full">
          <div className="mb-3 text-center">
            <p className="text-sm text-gray-600 font-medium animate-pulse flex items-center justify-center gap-2">
              <ScanLine className="w-4 h-4" /> Point camera at a barcode...
            </p>
          </div>
          <div
            id={scannerContainerId.current}
            className="w-full rounded-xl overflow-hidden border-2 border-blue-300 shadow-md"
          />
          <button
            onClick={stopScanning}
            className="mt-3 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {/* STEP: LOADING — Lookup in progress */}
      {step === 'loading' && (
        <div className="py-10 flex flex-col items-center justify-center text-gray-500 w-full">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
          <p className="font-medium">Looking up product...</p>
          <p className="text-xs text-gray-400 mt-1">Fetching from OpenFoodFacts</p>
        </div>
      )}

      {/* STEP: FORM — Product detected, fill remaining info */}
      {step === 'form' && (
        <div className="bg-white border w-full border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          {/* Scanned product info card */}
          {scannedProduct && scannedProduct.productName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              {scannedProduct.imageUrl ? (
                <img src={scannedProduct.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-blue-100" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-7 h-7 text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900 truncate">{scannedProduct.productName}</p>
                {scannedProduct.brand && <p className="text-xs text-blue-600">{scannedProduct.brand}</p>}
                {scannedProduct.category && <p className="text-xs text-blue-500 truncate">{scannedProduct.category}</p>}
                <p className="text-[10px] text-blue-400 mt-0.5 font-mono">Barcode: {scannedProduct.barcode}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
            </div>
          )}

          {/* Product Name — auto-filled (read-only if scanned, editable if manual) */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Name</label>
            <input
              className={`mt-1 w-full rounded-lg shadow-sm p-2.5 border text-gray-900 font-medium ${scannedProduct?.productName ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              readOnly={!!scannedProduct?.productName}
              placeholder="Product name (auto-filled from barcode)"
            />
          </div>

          {mode === 'add' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity *</label>
                  <input
                    type="number"
                    className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    min="1"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date *</label>
                  <input
                    type="date"
                    className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Distributor</label>
                  <input
                    className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm"
                    value={form.distributorName}
                    onChange={(e) => setForm((f) => ({ ...f, distributorName: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price/unit (₹)</label>
                  <input
                    type="number"
                    className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm"
                    value={form.purchasePrice}
                    onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch No</label>
                <input
                  className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-sm"
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity to Sell</label>
              <input
                type="number"
                className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border p-2.5 text-sm"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                min="1"
                placeholder="1"
              />
              <p className="text-xs text-gray-400 mt-1">Stock will be reduced using FIFO (earliest expiry first)</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {!disableScanner && (
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-medium transition-colors text-sm"
              >
                ← Re-scan
              </button>
            )}
            <button
              disabled={loading || !productName.trim()}
              onClick={handleSubmit}
              className={`flex-[2] text-white py-3 rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'add' ? (
                'Add Batch +'
              ) : (
                'Confirm Sale'
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP: SUCCESS */}
      {step === 'success' && (
        <div className="py-10 flex flex-col items-center justify-center w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="font-semibold text-green-700 text-lg">
            {mode === 'add' ? 'Stock Added!' : 'Sale Recorded!'}
          </p>
          <p className="text-sm text-gray-400">Refreshing dashboard...</p>
        </div>
      )}
    </div>
  )
}
