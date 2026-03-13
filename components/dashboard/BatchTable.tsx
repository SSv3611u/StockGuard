'use client'
import { useState } from 'react'
import ExpiryBadge from "./ExpiryBadge"
import { MinusCircle, Loader2 } from 'lucide-react'

interface Batch {
  id: string
  product: { name: string }
  batchNumber: string | null
  daysUntilExpiry: number
  quantity: number
  purchasePrice: number | null
  productId: string
}

interface Props {
  batches: Batch[]
  shopId: string
}

export default function BatchTable({ batches, shopId }: Props) {
  const [sellingId, setSellingId] = useState<string | null>(null)
  const [sellQty, setSellQty] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSell = async (batch: Batch) => {
    const qty = parseInt(sellQty)
    if (!qty || qty < 1) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/remove-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          productName: batch.product.name,
          productId: batch.productId,
          batchId: batch.id,
          quantity: qty,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSellingId(null)
      setSellQty('1')
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Batch Inventory</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{b.product.name}</td>
                <td className="px-4 py-3 text-gray-500">{b.batchNumber || "N/A"}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{b.quantity}</td>
                <td className="px-4 py-3 text-gray-900">{b.daysUntilExpiry}d</td>
                <td className="px-4 py-3 text-gray-900">
                  {b.purchasePrice ? `₹${(b.quantity * b.purchasePrice).toLocaleString('en-IN')}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <ExpiryBadge days={b.daysUntilExpiry} />
                </td>
                <td className="px-4 py-3">
                  {b.quantity > 0 && (
                    sellingId === b.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-14 border rounded px-1 py-0.5 text-xs"
                          value={sellQty}
                          onChange={(e) => setSellQty(e.target.value)}
                          min="1"
                          max={b.quantity}
                        />
                        <button
                          disabled={loading}
                          onClick={() => handleSell(b)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                        </button>
                        <button
                          onClick={() => { setSellingId(null); setError('') }}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSellingId(b.id); setSellQty('1'); setError('') }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        <MinusCircle className="w-3.5 h-3.5" /> Sell
                      </button>
                    )
                  )}
                  {error && sellingId === b.id && (
                    <p className="text-[10px] text-red-500 mt-0.5">{error}</p>
                  )}
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No batches tracked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
