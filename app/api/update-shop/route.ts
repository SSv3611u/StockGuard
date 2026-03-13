import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { whatsappNum } = await request.json()

  if (!whatsappNum) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

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

  // Target the specific demo shop ID that owns the products, or fall back to the first available shop
  const demoShopId = '11111111-1111-1111-1111-111111111111'
  
  const { data: demoExists } = await supabase.from('Shop').select('id').eq('id', demoShopId).single()
  
  let shopId = demoShopId
  if (!demoExists) {
    const { data: shops } = await supabase.from('Shop').select('id').limit(1)
    if (!shops || shops.length === 0) {
      return NextResponse.json({ error: 'No shops exist in the database yet.' }, { status: 404 })
    }
    shopId = shops[0].id
  }

  const { error } = await supabase
    .from('Shop')
    .update({ whatsappNum })
    .eq('id', shopId)

  if (error) {
    console.error('Update shop error:', error)
    return NextResponse.json({ error: 'Database update failed. This number might already be in use by another shop.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: `Shop updated to ${whatsappNum}` })
}
