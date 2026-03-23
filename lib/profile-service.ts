import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Profile, ProfileFormData } from '@/lib/types/profile'

/**
 * Get the currently authenticated user from Supabase Auth.
 * Must be called from Server Components or Route Handlers.
 */
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Fetch a profile by user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[getProfile]', error.message)
    return null
  }
  return data as Profile
}

/**
 * Fetch the current user's profile (convenience).
 */
export async function getCurrentProfile(): Promise<{ user: any; profile: Profile | null } | null> {
  const user = await getAuthUser()
  if (!user) return null
  const profile = await getProfile(user.id)
  return { user, profile }
}

/**
 * Update a profile by user ID. Only the owner can update (enforced by RLS).
 */
export async function updateProfile(userId: string, data: Partial<ProfileFormData>): Promise<{ profile: Profile | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('[updateProfile]', error.message)
    return { profile: null, error: error.message }
  }
  return { profile: updated as Profile, error: null }
}

/**
 * Check if a username is already taken.
 */
export async function isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())

  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }

  const { data } = await query.maybeSingle()
  return !!data
}

/**
 * Upload an avatar image to Supabase Storage.
 * Returns the public URL or an error.
 */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${userId}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadAvatar]', uploadError.message)
    return { url: null, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update the profile with the new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return { url: publicUrl, error: null }
}
