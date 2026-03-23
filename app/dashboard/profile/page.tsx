'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import { BUSINESS_CATEGORIES } from '@/lib/types/profile'
import { User, Mail, Phone, MapPin, Building, Fingerprint, AtSign, FileText, Loader2, Pencil, Calendar, Shield, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfilePage() {
  const { t } = useLanguage()
  const { profile, user, loading, error } = useProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin mx-auto mb-4" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Fetching your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm w-full bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {error || "We couldn't retrieve your profile details. Please try again or contact support if the issue persists."}
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold transition-all px-6 py-3 bg-orange-50 rounded-2xl text-sm">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const initials = profile.full_name
    ?.split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const categoryLabel = BUSINESS_CATEGORIES.find(c => c.value === profile.business_category)

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Unknown'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest border border-orange-100/50 mb-2">
            <Shield className="w-3 h-3" /> Account Verified
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t.profile}
          </h1>
          <p className="text-slate-500 font-medium">Manage your professional identity and shop configurations</p>
        </div>
        
        <Link
          href="/dashboard/profile/edit"
          className="group relative inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Pencil className="w-4 h-4" />
          Edit Experience
        </Link>
      </div>

      {/* Profile Container */}
      <div className="relative group">
        {/* Glow Effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        
        <div className="relative bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
          {/* Visual Banner */}
          <div className="h-48 md:h-64 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-amber-600 opacity-90" />
            
            {/* Abstract Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse-soft" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
          </div>

          {/* Profile Identity Section */}
          <div className="px-6 md:px-12 -mt-20 md:-mt-24 relative z-10 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
              {/* Avatar Box */}
              <div className="relative group/avatar">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-[32px] md:rounded-[48px] border-[6px] md:border-[10px] border-white shadow-2xl overflow-hidden bg-slate-50 flex items-center justify-center transform group-hover/avatar:scale-[1.02] transition-transform duration-500">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                      <span className="text-4xl md:text-6xl font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
              </div>

              {/* Name & Titles */}
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    {profile.full_name || 'Your Name'}
                  </h2>
                  {profile.username && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200/50">
                      @{profile.username}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-slate-500 font-semibold">
                  {profile.shop_name && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-500/70" />
                      <span>Proprietor, <span className="text-slate-900">{profile.shop_name}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500/70" />
                    <span>Active since {memberSince}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Divider */}
            <div className="my-10 h-px bg-slate-100" />

            {/* Main Info Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Column: About/Bio */}
              <div className="lg:col-span-1 space-y-8">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">About Me / परिचय</h4>
                  <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 relative group/bio overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <FileText className="w-12 h-12 text-slate-900" />
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed italic relative z-10">
                      {profile.bio ? `"${profile.bio}"` : "You haven't added a bio yet. Share something about your experience or business philosophy in the edit section."}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 rounded-[24px] bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Platform Status</h4>
                  <p className="text-xl font-bold mb-4">Prime Member</p>
                  <div className="w-full bg-white/20 h-1.5 rounded-full mb-3">
                    <div className="w-[85%] bg-white h-full rounded-full" />
                  </div>
                  <p className="text-[10px] font-medium opacity-90">Stock efficiency at 85% this month</p>
                </div>
              </div>

              {/* Right Column: Grid of Info */}
              <div className="lg:col-span-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Details / विवरण</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricCard
                    icon={<Mail className="w-5 h-5" />}
                    label="Primary Email"
                    value={user?.email || '--'}
                    color="blue"
                  />
                  <MetricCard
                    icon={<Phone className="w-5 h-5" />}
                    label="WhatsApp Connect"
                    value={profile.phone_number || '--'}
                    color="emerald"
                  />
                  <MetricCard
                    icon={<Building className="w-5 h-5" />}
                    label="Business Type"
                    value={categoryLabel ? categoryLabel.label : '--'}
                    color="violet"
                  />
                  <MetricCard
                    icon={<Fingerprint className="w-5 h-5" />}
                    label="GSTIN Status"
                    value={profile.gst_number || 'Not Linked'}
                    color="amber"
                  />
                  <MetricCard
                    icon={<MapPin className="w-5 h-5" />}
                    label="Operations Base"
                    value={profile.shop_address || '--'}
                    color="rose"
                    wide
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Support Callout */}
      <div className="mt-12 text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
         Need help with your profile? <Link href="#" className="text-orange-500 hover:underline flex items-center gap-1">Contact Support <ExternalLink className="w-3 h-3" /></Link>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color, wide }: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose'
  wide?: boolean
}) {
  const themes = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
  }

  return (
    <div className={`p-6 rounded-[28px] bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group/card ${wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover/card:scale-110 duration-500 ${themes[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm md:text-base font-bold text-slate-800 truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ArrowLeft(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  )
}
