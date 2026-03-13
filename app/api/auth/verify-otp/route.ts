import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSession } from '@/lib/auth'

const MAX_OTP_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Step 1: Fetch shopkeeper and stored OTP
    const { data: shopkeeper } = await supabase
      .from('Shopkeeper')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!shopkeeper) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Step 2: Check if OTP attempts exceeded
    if (shopkeeper.otpAttempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate the OTP
      await supabase
        .from('Shopkeeper')
        .update({ otpCode: null, otpExpiry: null, otpAttempts: 0 })
        .eq('id', shopkeeper.id)

      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    // Step 3: Check if OTP exists
    if (!shopkeeper.otpCode || !shopkeeper.otpExpiry) {
      return NextResponse.json(
        { error: 'No OTP has been requested. Please login again.' },
        { status: 400 }
      )
    }

    // Step 4: Check if OTP expired
    if (new Date(shopkeeper.otpExpiry) < new Date()) {
      await supabase
        .from('Shopkeeper')
        .update({ otpCode: null, otpExpiry: null, otpAttempts: 0 })
        .eq('id', shopkeeper.id)

      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 410 }
      )
    }

    // Step 5: Verify OTP
    if (shopkeeper.otpCode !== otp.toString().trim()) {
      // Increment attempt counter
      await supabase
        .from('Shopkeeper')
        .update({ otpAttempts: (shopkeeper.otpAttempts || 0) + 1 })
        .eq('id', shopkeeper.id)

      const remaining = MAX_OTP_ATTEMPTS - (shopkeeper.otpAttempts + 1)
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining} attempt(s) remaining.` },
        { status: 401 }
      )
    }

    // Step 6: OTP is valid — invalidate it so it can't be reused
    await supabase
      .from('Shopkeeper')
      .update({ otpCode: null, otpExpiry: null, otpAttempts: 0 })
      .eq('id', shopkeeper.id)

    // Step 7: Create authenticated session
    await createSession({
      shopkeeperId: shopkeeper.id,
      shopId: shopkeeper.shopId,
      shopName: shopkeeper.shopName,
      email: shopkeeper.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      shopId: shopkeeper.shopId,
      shopName: shopkeeper.shopName,
    })
  } catch (err) {
    console.error('OTP verification error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
