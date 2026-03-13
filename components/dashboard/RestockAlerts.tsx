import { AlertTriangle } from 'lucide-react'

interface RestockProduct {
  name: string
  stock: number
  avgDaily: number
}

interface Props {
  products: RestockProduct[]
}

export default function RestockAlerts({ products }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">Restock Recommended</h3>
      </div>
      <div className="space-y-2">
        {products.map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
            <div>
              <span className="font-medium text-gray-900 text-sm">{p.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                Stock: {p.stock} · Avg daily sales: {p.avgDaily}
              </span>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              Low Stock
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
