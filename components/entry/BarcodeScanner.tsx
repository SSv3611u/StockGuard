'use client'
import { useState, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props { shopId: string }

export default function BarcodeScanner({ shopId }: Props) {
  const [scanning, setScanning] = useState(false)
  const [productName, setProductName] = useState('')
  const [form, setForm] = useState({ batchNumber: '', expiryDate: '', quantity: '', purchasePrice: '' })
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const startScan = async () => {
    setScanning(true)
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    const deviceId = devices[devices.length - 1]?.deviceId // prefer back camera

    reader.decodeFromVideoDevice(deviceId, videoRef.current!, async (result) => {
      if (!result) return
      ;(reader as any).reset()
      setScanning(false)
      const code = result.getText()
      const res = await fetch(`/api/barcode?code=${code}`)
      const data = await res.json()
      setProductName(data.productName ?? '')
    })
  }

  const stopScan = () => {
    (readerRef.current as any)?.reset()
    setScanning(false)
  }

  const handleSubmit = async () => {
    await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        productName,
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
        quantity: parseInt(form.quantity),
        purchasePrice: parseFloat(form.purchasePrice),
      })
    })
    setProductName('')
    setForm({ batchNumber: '', expiryDate: '', quantity: '', purchasePrice: '' })
    window.location.reload()
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {!scanning && !productName && (
        <button onClick={startScan} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors">
          📷 Scan Barcode
        </button>
      )}

      {scanning && (
        <div className="relative w-full">
          <video ref={videoRef} className="w-full rounded-lg h-64 bg-gray-900 object-cover" />
          <button onClick={stopScan} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {productName !== '' && (
        <div className="bg-white border w-full border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product</label>
            <input
              className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 p-2 border"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Enter product name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch No</label>
              <input className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm" value={form.batchNumber}
                onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date</label>
              <input type="date" className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm" value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</label>
              <input type="number" className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="1" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price/unit (₹)</label>
              <input type="number" className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm" value={form.purchasePrice}
                onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} min="0" placeholder="0.00" />
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white py-3 rounded-lg font-medium shadow-sm mt-2">
            Save Stock
          </button>
        </div>
      )}
    </div>
  )
}
