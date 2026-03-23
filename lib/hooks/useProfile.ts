'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Profile, ProfileFormData } from '@/lib/types/profile'

interface UseProfileReturn {
  profile: Profile | null
  user: { id: string; email: string; created_at: string } | null
  loading: boolean
  saving: boolean
  uploading: boolean
  error: string | null
  success: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<ProfileFormData>) => Promise<boolean>
  uploadAvatar: (file: File) => Promise<string | null>
  clearMessages: () => void
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<{ id: string; email: string; created_at: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/profile')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      setUser(data.user)
      setProfile(data.profile)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (formData: Partial<ProfileFormData>): Promise<boolean> => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(data.profile)
      setSuccess('Profile updated successfully! / प्रोफ़ाइल अपडेट हो गई!')
      return true
    } catch (err: any) {
      setError(err.message || 'Update failed')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : prev)
      setSuccess('Avatar updated! / फ़ोटो अपडेट हो गयी!')
      return data.avatar_url
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    user,
    loading,
    saving,
    uploading,
    error,
    success,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    clearMessages,
  }
}
