import { supabase } from '@/lib/supabase'
import { calcAtRisk, calcRecovered, calcLost } from '@/lib/lossCalculator'
import LossCalculator from '@/components/dashboard/LossCalculator'
import BatchTable from '@/components/dashboard/BatchTable'
import DistributorScore from '@/components/dashboard/DistributorScore'
import InvoiceUpload from '@/components/entry/InvoiceUpload'
import ActionButtons from '@/components/dashboard/ActionButtons'
import DashboardWidgets from '@/components/dashboard/DashboardWidgets'
import RestockAlerts from '@/components/dashboard/RestockAlerts'
import ExpiryChecker from '@/components/dashboard/ExpiryChecker'
import SendSummaryButton from '@/components/dashboard/SendSummaryButton'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import SectionLabel from '@/components/dashboard/SectionLabel'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID || ''

async function resolveShopIdForDashboard() {
  const session = await getSession()
  if (session?.shopId) return session.shopId

  const cookieStore = await cookies()
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { },
      },
    }
  )

  const { data: authData } = await supabaseServer.auth.getUser()
  const user = authData.user
  const email = user?.email?.toLowerCase().trim()
  const meta = (user?.user_metadata || {}) as { shop_id?: string; shop_name?: string; shopName?: string }

  if (meta.shop_id) return meta.shop_id

  const metaShopName = meta.shop_name || meta.shopName
  if (metaShopName) {
    const { data: shopByName } = await supabaseServer
      .from('Shop')
      .select('id')
      .eq('name', metaShopName)
      .maybeSingle()
    if (shopByName?.id) return shopByName.id
  }

  if (email) {
    const { data: shopkeeper } = await supabaseServer
      .from('Shopkeeper')
      .select('shopId')
      .eq('email', email)
      .maybeSingle()
    if (shopkeeper?.shopId) return shopkeeper.shopId
  }

  return DEFAULT_SHOP_ID
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const resolvedShopId = await resolveShopIdForDashboard()

  const { data: products } = await supabase
    .from('Product')
    .select('id, name')
    .eq('shopId', resolvedShopId)

  const productIds = (products || []).map((p: any) => p.id)

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
    .eq('shopId', resolvedShopId)

  const salesPromise = supabase
    .from('Sales')
    .select('*')
    .eq('shopId', resolvedShopId)

  const [batchesRes, distributorsRes, salesRes] = await Promise.all([
    batchesPromise,
    distributorsPromise,
    salesPromise,
  ])

  const batches = batchesRes.data || []
  const distributors = distributorsRes.data || []
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

  let itemsSoldToday = 0
  let lowStockCount = 0
  let restockAlerts = 0
  let currentInventoryCount = 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const stockMap: Record<string, number> = {}
  const productNameMap: Record<string, string> = {}
  batches.forEach((b: any) => {
    stockMap[b.productId] = (stockMap[b.productId] || 0) + b.quantity
    currentInventoryCount += b.quantity
    if (b.product?.name) productNameMap[b.productId] = b.product.name
  })

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

  const restockProducts: { name: string; stock: number; limit: number }[] = []
  const RESTOCK_LIMIT_THRESHOLD = 10

  productIds.forEach((pid: string) => {
    const stock = stockMap[pid] || 0
    if (stock > 0 && stock <= 5) lowStockCount++

    if (stock > 0 && stock <= RESTOCK_LIMIT_THRESHOLD) {
      restockAlerts++
      restockProducts.push({
        name: productNameMap[pid] || pid,
        stock,
        limit: RESTOCK_LIMIT_THRESHOLD,
      })
    }
  })

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
    <main className="p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto flex-1">
      <ExpiryChecker />

      {/* Translated Header */}
      <DashboardHeader />

      {/* Loss Calculator */}
      <section className="mb-6">
        <SectionLabel sectionKey="lossCalculator" />
        <LossCalculator data={lossData} />
      </section>

      {/* Quick Actions */}
      <section className="mb-6">
        <SectionLabel sectionKey="quickActions" />
        <ActionButtons shopId={resolvedShopId} />
      </section>

      {/* WhatsApp Summary */}
      <div className="mb-6">
        <SendSummaryButton />
      </div>

      {/* Dashboard Stats */}
      <section className="mb-6">
        <SectionLabel sectionKey="overview" />
        <DashboardWidgets
          itemsSoldToday={itemsSoldToday}
          lowStockCount={lowStockCount}
          restockAlerts={restockAlerts}
          currentInventoryCount={currentInventoryCount}
        />
      </section>

      {/* Restock Alerts */}
      {restockProducts.length > 0 && (
        <RestockAlerts products={restockProducts} />
      )}

      {/* Invoice Upload */}
      <section className="mb-6">
        <InvoiceUpload shopId={resolvedShopId} />
      </section>

      {/* Batch Table */}
      <section className="mb-6">
        <BatchTable batches={batchesWithDays} shopId={resolvedShopId} />
      </section>

      {/* Distributors */}
      <section className="mb-6">
        <DistributorScore distributors={distData} />
      </section>
    </main>
  )
}
