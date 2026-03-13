'use client'
import { useState } from 'react'

interface OcrItem {
  productName: string
  batchNumber: string | null
  expiryDate: string | null
  quantity: number | null
  distributorName: string | null
}

interface Props { shopId: string }

export default function InvoiceUpload({ shopId }: Props) {
  const [items, setItems] = useState<OcrItem[]>([])
  const [selected, setSelected] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleFile = async () => {
    setLoading(true)
    setTimeout(() => {
        setItems([
          {
            productName: "Sample Scanned Product (WIP)",
            batchNumber: "B123",
            expiryDate: "2026-10-10",
            quantity: 50,
            distributorName: "Sharma Pharma"
          }
        ])
        setSelected([true])
        setLoading(false)
    }, 1500)
  }

  const saveAll = async () => {
    const toSave = items.filter((_, i) => selected[i] && items[i].expiryDate)
    for (const item of toSave) {
      await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          productName: item.productName,
          batchNumber: item.batchNumber ?? undefined,
          expiryDate: item.expiryDate,
          quantity: item.quantity ?? 0,
          distributorName: item.distributorName ?? undefined,
        })
      })
    }
    setSaved(true)
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div className="flex-1 w-full">
      {!loading && items.length === 0 && (
        <label className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md text-white py-3 rounded-lg font-medium flex items-center justify-center cursor-pointer">
          🧾 Upload Invoice (WIP)
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </label>
      )}

      {loading && <div className="text-center bg-gray-50 border border-gray-200 py-4 font-medium text-gray-500 rounded-lg w-full flex-1">Reading invoice...</div>}

      {items.length > 0 && !saved && (
        <div className="bg-white border rounded-lg p-4 w-full shadow-sm">
          <p className="font-medium text-sm mb-3">Found {items.length} items — deselect any to skip:</p>
          {items.map((item, i) => (
            <label key={i} className="flex items-start gap-2 mb-2 text-sm bg-gray-50 p-2 rounded border border-gray-100 cursor-pointer hover:bg-gray-100">
              <input type="checkbox" checked={selected[i]}
                className="mt-1"
                onChange={e => setSelected(s => s.map((v, j) => j === i ? e.target.checked : v))} />
              <span className="flex-1">
                <strong className="text-gray-900 block">{item.productName}</strong>
                <span className="text-gray-500">
                    {item.batchNumber && `Batch ${item.batchNumber}`}
                    {item.expiryDate && ` • Exp ${item.expiryDate}`}
                    {item.quantity && ` • ${item.quantity} units`}
                </span>
              </span>
            </label>
          ))}
          <button onClick={saveAll} className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white py-2 rounded-lg text-sm font-medium mt-2 shadow-sm">
            Save All Selected
          </button>
        </div>
      )}

      {saved && <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg text-center font-medium py-3">✅ Saved! Refreshing...</div>}
    </div>
  )
}
