'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import ProfileForm from '@/components/profile/ProfileForm'
import AvatarUpload from '@/components/profile/AvatarUpload'
import { Loader2, ArrowLeft, Shield, Info } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function EditProfilePage() {
  const { t } = useLanguage()
  const {
    profile,
    user,
    loading,
    saving,
    uploading,
    error,
    success,
    updateProfile,
    uploadAvatar,
    clearMessages,
  } = useProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500">Preparing editor...</p>
        </div>
      </div>
    )
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 max-w-sm">
          <p className="text-slate-500 mb-6 font-medium">Session expired or profile unavailable.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-orange-600 font-bold px-6 py-3 bg-orange-50 rounded-2xl text-sm transition-all hover:bg-orange-100">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Navigation */}
      <div className="flex items-center gap-6 mb-10">
        <Link
          href="/dashboard/profile"
          className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all shadow-lg shadow-slate-200/50"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 mb-2">
            Settings / संपादन
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Update Profile
          </h1>
          <p className="text-slate-500 text-sm font-medium">Refining your identity for the marketplace</p>
        </div>
      </div>

      <div className="relative">
        {/* Visual Gaps for Depth */}
        <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-[44px] blur-3xl -z-10" />
        
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
          {/* Form Header with Visual Background */}
          <div className="h-40 bg-slate-900 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-800" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:24px_24px]" />
          </div>

          <div className="px-6 md:px-12 -mt-16 relative z-10 pb-12">
            <div className="flex flex-col md:flex-row items-end gap-6 mb-10">
              <AvatarUpload
                currentUrl={profile.avatar_url}
                fullName={profile.full_name}
                uploading={uploading}
                onUpload={uploadAvatar}
              />
              <div className="pb-2 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-xl overflow-hidden min-w-[200px]">
                <div className="absolute inset-0 bg-white/5 opacity-50" />
                <h2 className="text-lg font-bold text-slate-900 relative z-10">
                  {profile.full_name || 'Anonymous User'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold relative z-10">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> Secure Account
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-10 flex gap-4 text-orange-800 text-xs font-semibold leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-orange-500" />
              Your public profile is visible to distributors and customers to build trust. Keep it updated with accurate business details.
            </div>

            {/* Core Form Section */}
            <div className="bg-slate-50/50 p-2 rounded-[32px] border border-slate-100">
              <div className="bg-white p-8 md:p-10 rounded-[28px] shadow-sm">
                <ProfileForm
                  profile={profile}
                  userEmail={user.email}
                  saving={saving}
                  error={error}
                  success={success}
                  onSave={updateProfile}
                  onClearMessages={clearMessages}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-12 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em] opacity-40">
         Powered by StockGuard Systems © 2026
      </div>
    </div>
  )
}
