import { Package, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'

interface DashboardWidgetsProps {
  itemsSoldToday: number
  lowStockCount: number
  restockAlerts: number
  currentInventoryCount: number
}

export default function DashboardWidgets({ 
  itemsSoldToday, 
  lowStockCount, 
  restockAlerts, 
  currentInventoryCount 
}: DashboardWidgetsProps) {
  
  const widgets = [
    { title: "Current Inventory", value: currentInventoryCount, icon: <Package className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100", textColor: "text-blue-900" },
    { title: "Items Sold Today", value: itemsSoldToday, icon: <DollarSign className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-100", textColor: "text-emerald-900" },
    { title: "Low Stock Items", value: lowStockCount, icon: <TrendingDown className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100", textColor: "text-amber-900" },
    { title: "Restock Recommended", value: restockAlerts, icon: <AlertCircle className="w-5 h-5 text-red-600" />, bg: "bg-red-100", textColor: "text-red-900" }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {widgets.map((widget, i) => (
        <div key={i} className={`p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3 bg-white`}>
          <div className={`p-3 rounded-full ${widget.bg} shrink-0`}>
            {widget.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{widget.title}</p>
            <p className={`text-xl font-bold ${widget.textColor}`}>{widget.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
