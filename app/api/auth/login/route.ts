import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyCredentials, generateOTP, getOTPExpiry } from '@/lib/auth'
import { sendSMS } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Step 1: Verify credentials
    const shopkeeper = await verifyCredentials(email, password)
    if (!shopkeeper) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 2: Generate OTP
    const otp = generateOTP()
    const otpExpiry = getOTPExpiry()

    // Step 3: Save OTP in database (reset attempts)
    const { error: updateErr } = await supabase
      .from('Shopkeeper')
      .update({
        otpCode: otp,
        otpExpiry: otpExpiry.toISOString(),
        otpAttempts: 0,
      })
      .eq('id', shopkeeper.id)

    if (updateErr) {
      console.error('OTP save error:', updateErr)
      return NextResponse.json(
        { error: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      )
    }

    // Step 4: Send OTP via SMS
    try {
      await sendSMS(
        shopkeeper.phoneNumber,
        `Your StockGuard verification code is ${otp}. It expires in 5 minutes.`
      )
    } catch (smsErr) {
      console.error('SMS send error:', smsErr)
      // In development, log the OTP so testing is possible
      console.log(`[DEV] OTP for ${email}: ${otp}`)
      return NextResponse.json({
        success: true,
        message: 'OTP generated (SMS delivery may be unavailable in dev mode)',
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your registered phone number',
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
