import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/profile-service'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST /api/profile/avatar — Upload avatar image
 * Accepts multipart/form-data with a single "file" field
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, WebP, or GIF.' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 2MB allowed.' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('[Avatar Upload]', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Avatar Profile Update]', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      avatar_url: publicUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (err: any) {
    console.error('[POST /api/profile/avatar]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
