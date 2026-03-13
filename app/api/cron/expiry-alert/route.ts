import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendAlert } from '@/lib/twilio'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const urlObj = new URL(request.url)
  const isTest = urlObj.searchParams.get('test') === 'true'
  const isReport = urlObj.searchParams.get('report') === 'true'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { },
      },
    }
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const alertWindow = new Date(today)
  alertWindow.setDate(today.getDate() + 3)

  try {
    // 🔍 TEST MODE: Simple connectivity check
    if (isTest) {
      // Find ANY shop that has a number
      const { data: testShops, error: shopError } = await supabase
        .from('Shop')
        .select('*')
        .not('whatsappNum', 'is', null)
        .limit(1)

      if (shopError) throw shopError

      if (testShops && testShops[0]?.whatsappNum) {
        await sendAlert(testShops[0].whatsappNum, `StockGuard Connectivity Verified! ✅\n\nYour shop "${testShops[0].name}" is ready for the hackathon! Good luck!`)
        return NextResponse.json({ success: true, message: 'Test alert sent successfully.' })
      }
      return NextResponse.json({ success: false, error: 'No configured shop found. Please update your number in Settings.' }, { status: 404 })
    }

    // 1. Fetch expiring batches
    // Use the explicit relationship name and productId field
    let query = supabase
      .from('Batch')
      .select('*, product:Product!productId(shopId, name)')
      .lte('expiryDate', alertWindow.toISOString())
      .gt('quantity', 0)
    
    if (!isReport) {
        // Fallback for the alert_sent column which might be missing or named differently
        // We'll use a try-catch pattern or just check all batches for now during the hackathon
        // to ensure the user gets his data.
    }

    const { data: batches, error: batchError } = await query
    
    if (batchError) {
      console.error('Batch Fetch Error:', batchError)
      // Fallback query without the complex join if it fails
      const { data: simpleBatches, error: simpleError } = await supabase
        .from('Batch')
        .select('*')
        .lte('expiryDate', alertWindow.toISOString())
        .gt('quantity', 0)
      
      if (simpleError) throw simpleError
      
      // Manually link products if the join failed
      const productIds = [...new Set(simpleBatches?.map(b => b.productId))]
      const { data: products } = await supabase.from('Product').select('id, shopId, name').in('id', productIds)
      const productMap = (products || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {})
      
      return processReport(simpleBatches?.map(b => ({ ...b, product: productMap[b.productId] })) || [], isReport, supabase)
    }

    return processReport(batches || [], isReport, supabase)

  } catch (error: any) {
    console.error('CRON_ERROR:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

async function processReport(batches: any[], isReport: boolean, supabase: any) {
    // Filter out batches without a valid product/shop link
    const validBatches = batches.filter(b => b.product && b.product.shopId)

    if (validBatches.length === 0) {
      return NextResponse.json({ success: true, message: 'No expiring items found for your shops.' })
    }

    // 2. Identify Shops
    const shopIds = [...new Set(validBatches.map(b => b.product.shopId))]
    const { data: shops } = await supabase.from('Shop').select('*').in('id', shopIds)
    
    if (!shops || shops.length === 0) {
        return NextResponse.json({ success: true, message: 'Shops found, but none have alert configurations.' })
    }

    const shopMap = shops.reduce((acc: any, s: any) => ({ ...acc, [s.id]: s }), {})
    let alertedShops = 0

    for (const shopId in shopMap) {
        const shop = shopMap[shopId]
        if (!shop.whatsappNum) continue

        const shopBatches = validBatches.filter(b => b.product.shopId === shopId)
        if (shopBatches.length === 0) continue

        let message = `StockGuard ${isReport ? 'Report' : 'Alert'} 🚨\n\nShop: ${shop.name}\n\nExpiries (3 days):\n`
        shopBatches.forEach((b, i) => {
            const date = new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            message += `${i+1}. ${b.product.name} - Qty: ${b.quantity} (Exp: ${date})\n`
        })
        message += `\nPlease check your stock.`

        try {
            await sendAlert(shop.whatsappNum, message)
            alertedShops++
        } catch (err) {
            console.error(`Failed to send to shop ${shopId}:`, err)
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: alertedShops > 0 ? `Alerts sent to ${alertedShops} shops.` : 'No alerts could be sent (missing phone numbers).' 
    })
}
