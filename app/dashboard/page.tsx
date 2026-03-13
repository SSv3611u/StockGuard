import { supabase } from '@/lib/supabase'
import { calcAtRisk, calcRecovered, calcLost } from '@/lib/lossCalculator'
import LossCalculator from '@/components/dashboard/LossCalculator'
import BatchTable from '@/components/dashboard/BatchTable'
import DistributorScore from '@/components/dashboard/DistributorScore'
import InvoiceUpload from '@/components/entry/InvoiceUpload'
import BarcodeScanner from '@/components/entry/BarcodeScanner'

const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID!

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Step 1: Get all product IDs for this shop
  const { data: products } = await supabase
    .from('Product')
    .select('id')
    .eq('shopId', SHOP_ID)

  const productIds = (products || []).map((p: any) => p.id)

  const [{ data: batches }, { data: distributors }] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from('Batch')
          .select('*, product:Product(*), distributor:Distributor(*)')
          .in('productId', productIds)
          .order('expiryDate', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from('Distributor')
      .select('*, returnLogs:ReturnLog(*)')
      .eq('shopId', SHOP_ID)
  ])

  // Get return logs for batches we have
  const batchIds = (batches || []).map((b: any) => b.id)
  const { data: returnLogs } = batchIds.length > 0
    ? await supabase
        .from('ReturnLog')
        .select('*, batch:Batch(*)')
        .in('batchId', batchIds)
    : Promise.resolve({ data: [] })

  const safeBatches = batches || []
  const safeReturnLogs = returnLogs || []
  const safeDistributors = distributors || []

  const acceptedIds = new Set(safeReturnLogs.filter((r: any) => r.outcome === 'accepted').map((r: any) => r.batchId) as string[])
  const today = new Date()

  const lossData = {
    atRisk: Math.round(calcAtRisk(safeBatches)),
    recovered: Math.round(calcRecovered(safeReturnLogs)),
    lost: Math.round(calcLost(safeBatches, acceptedIds)),
    atRiskCount: safeBatches.filter((b: any) => {
      const d = (new Date(b.expiryDate).getTime() - today.getTime()) / 86400000
      return d > 0 && d <= 30
    }).length,
  }

  const batchesWithDays = safeBatches.map((b: any) => ({
    ...b,
    daysUntilExpiry: Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / 86400000)
  }))

  const distData = safeDistributors.map((d: any) => ({
    id: d.id, name: d.name,
    total: d.returnLogs.length,
    accepted: d.returnLogs.filter((r: any) => r.outcome === 'accepted').length,
    rejected: d.returnLogs.filter((r: any) => r.outcome === 'rejected').length,
    hasEscalation: d.returnLogs.filter((r: any) => r.outcome === 'rejected').length >= 2
  }))

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">ExpiryGuard</h1>
        <p className="text-gray-500 text-sm">Ram Medical Store</p>
      </header>

      <LossCalculator data={lossData} />

      <section className="my-6 flex gap-3">
        <BarcodeScanner shopId={SHOP_ID} />
        <InvoiceUpload shopId={SHOP_ID} />
      </section>

      <BatchTable batches={batchesWithDays} />

      <section className="mt-8">
        <h2 className="text-lg font-medium mb-3">Distributors</h2>
        <DistributorScore distributors={distData} />
      </section>
    </main>
  )
}
