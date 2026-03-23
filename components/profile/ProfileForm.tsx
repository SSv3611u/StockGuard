'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, Building, Phone, Fingerprint, AtSign, FileText, Loader2, Save, CheckCircle2, AlertCircle, Info, ChevronRight } from 'lucide-react'
import { BUSINESS_CATEGORIES, type ProfileFormData } from '@/lib/types/profile'
import type { Profile } from '@/lib/types/profile'

interface ProfileFormProps {
  profile: Profile
  userEmail: string
  saving: boolean
  error: string | null
  success: string | null
  onSave: (data: Partial<ProfileFormData>) => Promise<boolean>
  onClearMessages: () => void
}

export default function ProfileForm({ profile, userEmail, saving, error, success, onSave, onClearMessages }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormData>({
    full_name: profile.full_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    phone_number: profile.phone_number || '',
    shop_name: profile.shop_name || '',
    business_category: profile.business_category || '',
    shop_address: profile.shop_address || '',
    gst_number: profile.gst_number || '',
  })

  // Sync when profile prop changes
  useEffect(() => {
    setForm({
      full_name: profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      phone_number: profile.phone_number || '',
      shop_name: profile.shop_name || '',
      business_category: profile.business_category || '',
      shop_address: profile.shop_address || '',
      gst_number: profile.gst_number || '',
    })
  }, [profile])

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    onClearMessages()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-1000">
      {/* Visual Section: Identity */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100/50">
            <User className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Personal Identity</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">व्यक्तिगत पहचान</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 px-2">
          {/* Full Name */}
          <InputGroup
            id="full_name"
            label="Full Name / पूरा नाम"
            icon={<User className="w-4 h-4" />}
            required
          >
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              required
              className="peer w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
            />
          </InputGroup>

          {/* Username */}
          <InputGroup
            id="username"
            label="Username / यूज़रनेम"
            icon={<AtSign className="w-4 h-4" />}
            subtext="Unique ID for sharing profile"
          >
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              placeholder="rajesh.kumar"
              maxLength={30}
              className="peer w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
            />
          </InputGroup>

          {/* Email (Read only) */}
          <InputGroup
            id="email"
            label="Verified Email / ईमेल"
            icon={<Mail className="w-4 h-4" />}
            locked
          >
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                readOnly
                className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-transparent rounded-[24px] text-slate-400 font-bold cursor-not-allowed"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/10">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </div>
            </div>
          </InputGroup>

          {/* Phone */}
          <InputGroup
            id="phone_number"
            label="WhatsApp Number / व्हाट्सएप नंबर"
            icon={<Phone className="w-4 h-4" />}
          >
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              placeholder="+91 98765 43210"
              className="peer w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
            />
          </InputGroup>

          {/* Bio */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] px-1 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span>Professional Bio / अपना परिचय</span>
              </div>
              <span>{form.bio.length}/300</span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell distributors about your experience or your business commitment..."
              rows={4}
              maxLength={300}
              className="w-full p-6 bg-slate-50 border border-transparent rounded-[32px] focus:bg-white focus:border-orange-200 focus:ring-8 focus:ring-orange-500/5 outline-none transition-all text-slate-800 font-medium leading-relaxed placeholder-slate-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Visual Section: Shop */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
           <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
            <Building className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Business Configuration</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">व्यापार विन्यास</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 px-2">
           {/* Shop Name */}
           <InputGroup
            id="shop_name"
            label="Shop Name / दुकान का नाम"
            icon={<Building className="w-4 h-4" />}
          >
            <input
              type="text"
              value={form.shop_name}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="e.g. Ram Medical Store"
              className="peer w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
            />
          </InputGroup>

          {/* Category */}
          <InputGroup
            id="business_category"
            label="Trade Category / श्रेणी"
            icon={<ChevronRight className="w-4 h-4 rotate-90" />}
          >
            <select
              value={form.business_category}
              onChange={(e) => handleChange('business_category', e.target.value)}
              className="peer w-full px-6 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-bold appearance-none cursor-pointer"
            >
              <option value="">Select Category / श्रेणी चुनें</option>
              {BUSINESS_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </InputGroup>

           {/* GST */}
           <InputGroup
            id="gst_number"
            label="GSTIN Status"
            icon={<Fingerprint className="w-4 h-4" />}
          >
            <input
              type="text"
              value={form.gst_number}
              onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className="peer w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[24px] focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all text-slate-900 font-black tracking-widest placeholder-slate-300 uppercase"
            />
          </InputGroup>

          {/* Address */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] px-1 mb-2 gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Operating Address / दुकान का पता</span>
            </div>
            <textarea
              value={form.shop_address}
              onChange={(e) => handleChange('shop_address', e.target.value)}
              placeholder="Include building number, street, locality and pincode for accurate deliveries..."
              rows={2}
              className="w-full p-6 bg-slate-50 border border-transparent rounded-[32px] focus:bg-white focus:border-orange-200 focus:ring-8 focus:ring-orange-500/5 outline-none transition-all text-slate-800 font-bold leading-relaxed placeholder-slate-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Success/Error Toasts */}
      {(error || success) && (
        <div className={`p-6 rounded-[32px] flex items-center gap-4 text-sm animate-in zoom-in-95 duration-500 border-2 ${
          success
            ? 'bg-emerald-50 text-emerald-900 border-emerald-100 shadow-xl shadow-emerald-500/10'
            : 'bg-red-50 text-red-900 border-red-100 shadow-xl shadow-red-500/10'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
             <p className="font-black text-xs uppercase tracking-widest opacity-60 mb-0.5">{success ? 'Update Successful' : 'Submission Error'}</p>
             <p className="font-bold">{success || error}</p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
        <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest px-4">
          <Info className="w-4 h-4 text-orange-400" />
          Mandatory fields are marked with *
        </div>
        
        <button
          type="submit"
          disabled={saving || !form.full_name.trim()}
          className="group w-full md:w-auto bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-slate-300 active:scale-[0.98] disabled:opacity-50 text-sm overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          {saving ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Save className="w-5 h-5 relative z-10" />
          )}
          <span className="relative z-10">
            {saving ? 'UPDATING SYSTEM...' : 'SAVE CONFIGURATION / सुरक्षित करें'}
          </span>
        </button>
      </div>
    </form>
  )
}

function InputGroup({ id, label, icon, children, required, subtext, locked }: {
  id: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  required?: boolean
  subtext?: string
  locked?: boolean
}) {
  return (
    <div className="space-y-3 relative group/input">
      <div className="flex items-center justify-between px-1">
        <label htmlFor={id} className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${locked ? 'text-slate-400' : 'text-slate-400 group-focus-within/input:text-orange-600'}`}>
          {label} {required && <span className="text-red-500 font-black">*</span>}
        </label>
        {subtext && <span className="text-[10px] font-bold text-slate-300 italic opacity-0 group-focus-within/input:opacity-100 transition-opacity">{subtext}</span>}
      </div>
      
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${locked ? 'text-slate-300' : 'text-slate-400 group-focus-within/input:text-orange-500'}`}>
          {icon}
        </div>
        {children}
        
        {!locked && (
           <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
           </div>
        )}
      </div>
    </div>
  )
}
