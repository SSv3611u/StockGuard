import { supabase } from '@/lib/supabase'
import { calcAtRisk, calcRecovered, calcLost } from '@/lib/lossCalculator'
import LossCalculator from '@/components/dashboard/LossCalculator'
import BatchTable from '@/components/dashboard/BatchTable'
import DistributorScore from '@/components/dashboard/DistributorScore'
import InvoiceUpload from '@/components/entry/InvoiceUpload'
import ActionButtons from '@/components/dashboard/ActionButtons'
import DashboardWidgets from '@/components/dashboard/DashboardWidgets'
import RestockAlerts from '@/components/dashboard/RestockAlerts'
import LogoutButton from '@/components/dashboard/LogoutButton'
import ExpiryChecker from '@/components/dashboard/ExpiryChecker'

const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID || ''

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data: products } = await supabase
    .from('Product')
    .select('id, name')
    .eq('shopId', SHOP_ID)

  const productIds = (products || []).map((p: any) => p.id)

  // Fetch batches and distributors (always works)
  const batchesPromise = productIds.length > 0
    ? supabase
        .from('Batch')
        .select('*, product:Product(*), distributor:Distributor(*)')
        .in('productId', productIds)
        .order('expiryDate', { ascending: true })
    : Promise.resolve({ data: [], error: null })

  const distributorsPromise = supabase
    .from('Distributor')
    .select('*, returnLogs:ReturnLog(*)')
    .eq('shopId', SHOP_ID)

  // Fetch sales (graceful — table might not exist yet)
  const salesPromise = supabase
    .from('Sales')
    .select('*')
    .eq('shopId', SHOP_ID)

  const [batchesRes, distributorsRes, salesRes] = await Promise.all([
    batchesPromise,
    distributorsPromise,
    salesPromise,
  ])

  const batches = batchesRes.data || []
  const distributors = distributorsRes.data || []
  // If Sales table doesn't exist, salesRes.error will be set but salesRes.data will be null
  const sales = salesRes.data || []

  const batchIds = batches.map((b: any) => b.id)
  const returnLogsRes = batchIds.length > 0
    ? await supabase
        .from('ReturnLog')
        .select('*, batch:Batch(*)')
        .in('batchId', batchIds)
    : { data: [] }

  const returnLogs = returnLogsRes.data || []

  const acceptedIds = new Set(returnLogs.filter((r: any) => r.outcome === 'accepted').map((r: any) => r.batchId) as string[])
  const today = new Date()

  // ──────────────────────────────────────────
  // Inventory & Sales Metrics
  // ──────────────────────────────────────────
  let itemsSoldToday = 0
  let lowStockCount = 0
  let restockAlerts = 0
  let currentInventoryCount = 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Stock per product
  const stockMap: Record<string, number> = {}
  const productNameMap: Record<string, string> = {}
  batches.forEach((b: any) => {
    stockMap[b.productId] = (stockMap[b.productId] || 0) + b.quantity
    currentInventoryCount += b.quantity
    if (b.product?.name) productNameMap[b.productId] = b.product.name
  })

  // Sales aggregation (7-day window for restock, today's for widget)
  const salesMap7d: Record<string, number> = {}
  sales.forEach((s: any) => {
    const saleDate = new Date(s.createdAt)
    if (saleDate >= todayStart) {
      itemsSoldToday += s.quantity
    }
    if (saleDate >= sevenDaysAgo) {
      salesMap7d[s.productId] = (salesMap7d[s.productId] || 0) + s.quantity
    }
  })

  // Restock alerts: static threshold (e.g. stock <= 10)
  const restockProducts: { name: string; stock: number; limit: number }[] = []
  const RESTOCK_LIMIT_THRESHOLD = 10

  productIds.forEach((pid: string) => {
    const stock = stockMap[pid] || 0
    if (stock > 0 && stock <= 5) lowStockCount++

    // Setup custom limit here (<= 10)
    if (stock > 0 && stock <= RESTOCK_LIMIT_THRESHOLD) {
      restockAlerts++
      restockProducts.push({
        name: productNameMap[pid] || pid,
        stock,
        limit: RESTOCK_LIMIT_THRESHOLD,
      })
    }
  })

  // ──────────────────────────────────────────
  // Existing Loss Data
  // ──────────────────────────────────────────
  const lossData = {
    atRisk: Math.round(calcAtRisk(batches)),
    recovered: Math.round(calcRecovered(returnLogs)),
    lost: Math.round(calcLost(batches, acceptedIds)),
    atRiskCount: batches.filter((b: any) => {
      const d = (new Date(b.expiryDate).getTime() - today.getTime()) / 86400000
      return d > 0 && d <= 30
    }).length,
  }

  const batchesWithDays = batches.map((b: any) => ({
    ...b,
    daysUntilExpiry: Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / 86400000)
  }))

  const distData = (distributors || []).map((d: any) => ({
    id: d.id, name: d.name,
    total: d.returnLogs.length,
    accepted: d.returnLogs.filter((r: any) => r.outcome === 'accepted').length,
    rejected: d.returnLogs.filter((r: any) => r.outcome === 'rejected').length,
    hasEscalation: d.returnLogs.filter((r: any) => r.outcome === 'rejected').length >= 2
  }))

  return (
    <main className="p-6 md:p-8 w-full max-w-7xl mx-auto flex-1">
      <ExpiryChecker />
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">StockGuard</h1>
          <p className="text-gray-500 text-sm">Inventory Management Dashboard</p>
        </div>
        <LogoutButton />
      </header>

      <DashboardWidgets
        itemsSoldToday={itemsSoldToday}
        lowStockCount={lowStockCount}
        restockAlerts={restockAlerts}
        currentInventoryCount={currentInventoryCount}
      />

      <ActionButtons shopId={SHOP_ID} />

      {restockProducts.length > 0 && (
        <RestockAlerts products={restockProducts} />
      )}

      <LossCalculator data={lossData} />

      <section className="my-6">
        <InvoiceUpload shopId={SHOP_ID} />
      </section>

      <BatchTable batches={batchesWithDays} shopId={SHOP_ID} />

      <section className="mt-8">
        <h2 className="text-lg font-medium mb-3">Distributors</h2>
        <DistributorScore distributors={distData} />
      </section>
    </main>
  )
}
