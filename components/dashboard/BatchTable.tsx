'use client'
import { useState } from 'react'
import ExpiryBadge from "./ExpiryBadge"
import { MinusCircle, Loader2, Search } from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')

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

  const filtered = batches.filter(b =>
    b.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.batchNumber && b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Separate critical batches
  const criticalBatches = filtered.filter(b => b.daysUntilExpiry <= 15)
  const otherBatches = filtered.filter(b => b.daysUntilExpiry > 15)

  return (
    <div className="space-y-4">
      {/* Critical Batches Alert */}
      {criticalBatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-2xl p-4 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-bold text-red-800 text-sm">Critical Batches / गंभीर बैच</h3>
            <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{criticalBatches.length}</span>
          </div>
          <div className="space-y-2">
            {criticalBatches.map(b => (
              <div key={b.id} className="bg-white rounded-xl p-3 border border-red-100 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{b.product.name}</p>
                  <p className="text-[11px] text-gray-500">
                    Batch {b.batchNumber || 'N/A'} · {b.quantity} units · {b.daysUntilExpiry <= 0 ? 'Expired' : `${b.daysUntilExpiry} days left`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ExpiryBadge days={b.daysUntilExpiry} />
                  {b.quantity > 0 && (
                    sellingId === b.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-12 border border-gray-300 rounded-lg px-1.5 py-1 text-xs focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                          value={sellQty}
                          onChange={(e) => setSellQty(e.target.value)}
                          min="1"
                          max={b.quantity}
                        />
                        <button
                          disabled={loading}
                          onClick={() => handleSell(b)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                        </button>
                        <button
                          onClick={() => { setSellingId(null); setError('') }}
                          className="text-gray-400 hover:text-gray-600 text-xs w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSellingId(b.id); setSellQty('1'); setError('') }}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg"
                      >
                        <MinusCircle className="w-3.5 h-3.5" /> Sell
                      </button>
                    )
                  )}
                </div>
                {error && sellingId === b.id && (
                  <p className="text-[10px] text-red-500 mt-0.5">{error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Batch Inventory / बैच इन्वेंटरी</h2>
            <p className="text-xs text-gray-400">{filtered.length} items</p>
          </div>
          <div className="sm:ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product... / खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none w-full sm:w-60 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-[11px] text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Product / उत्पाद</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Value / मूल्य</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {otherBatches.map((b) => (
                <tr key={b.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{b.product.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{b.batchNumber || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-900 font-bold">{b.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${b.daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {b.daysUntilExpiry}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">
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
                            className="w-12 border border-gray-300 rounded-lg px-1.5 py-1 text-xs focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                            value={sellQty}
                            onChange={(e) => setSellQty(e.target.value)}
                            min="1"
                            max={b.quantity}
                          />
                          <button
                            disabled={loading}
                            onClick={() => handleSell(b)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                          </button>
                          <button
                            onClick={() => { setSellingId(null); setError('') }}
                            className="text-gray-400 hover:text-gray-600 text-xs w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSellingId(b.id); setSellQty('1'); setError('') }}
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors hover:bg-orange-50 px-2 py-1 rounded-lg"
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📦</span>
                      <p className="text-gray-500 font-medium">No batches found</p>
                      <p className="text-gray-400 text-xs">कोई बैच नहीं मिला</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
