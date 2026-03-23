import { NextResponse } from 'next/server'
import { getAuthUser, getProfile, updateProfile, isUsernameTaken } from '@/lib/profile-service'

/**
 * GET /api/profile — Fetch the current user's profile
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.shop_name || '',
        username: null,
        bio: null,
        avatar_url: null,
        phone_number: user.user_metadata?.phone_number || '',
        shop_name: user.user_metadata?.shop_name || '',
        business_category: null,
        shop_address: null,
        gst_number: null,
        created_at: user.created_at,
        updated_at: user.created_at,
      },
    })
  } catch (err: any) {
    console.error('[GET /api/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/profile — Update the current user's profile
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, username, bio, phone_number, shop_name, business_category, shop_address, gst_number } = body

    // Validate username uniqueness if provided
    if (username) {
      const sanitizedUsername = username.toLowerCase().trim()

      // Validate format: alphanumeric, underscores, dots, 3-30 chars
      if (!/^[a-z0-9._]{3,30}$/.test(sanitizedUsername)) {
        return NextResponse.json(
          { error: 'Username must be 3-30 characters, only lowercase letters, numbers, dots, and underscores.' },
          { status: 400 }
        )
      }

      const taken = await isUsernameTaken(sanitizedUsername, user.id)
      if (taken) {
        return NextResponse.json(
          { error: 'This username is already taken. Try a different one.' },
          { status: 409 }
        )
      }
    }

    const { profile, error } = await updateProfile(user.id, {
      full_name: full_name?.trim() || '',
      username: username?.toLowerCase().trim() || null,
      bio: bio?.trim() || null,
      phone_number: phone_number?.trim() || '',
      shop_name: shop_name?.trim() || '',
      business_category: business_category || null,
      shop_address: shop_address?.trim() || null,
      gst_number: gst_number?.toUpperCase().trim() || null,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ profile, message: 'Profile updated successfully' })
  } catch (err: any) {
    console.error('[POST /api/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
