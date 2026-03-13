'use client'

import { useState } from 'react'
import { Bell, Smartphone, Shield, CheckCircle2, AlertCircle, Loader2, Phone } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [updatingPhone, setUpdatingPhone] = useState(false)

  const triggerTestAlert = async (type: 'test' | 'report') => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/cron/expiry-alert?${type}=true`, {
        headers: {
          'Authorization': 'Bearer hackathon-secret-123'
        }
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || `API Error: ${res.status}`)
      }
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `${type === 'test' ? 'Test alert' : 'Expiry report'} sent successfully! Check your phone.` 
        })
      } else {
        throw new Error(data.error || 'Failed to send alert')
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'API request failed' })
    } finally {
      setLoading(false)
    }
  }

  const updatePhone = async () => {
    if (!phoneNumber) return
    setUpdatingPhone(true)
    setStatus(null)
    try {
      const res = await fetch('/api/update-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNum: phoneNumber })
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: 'Phone number updated successfully! Now you can receive alerts.' })
      } else {
        throw new Error(data.error || 'Failed to update phone number')
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Update failed' })
    } finally {
      setUpdatingPhone(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-8 font-poppins">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-500">Inventory Monitoring & Notification Hub</p>
      </div>

      <div className="space-y-6">
        {/* Contact Configuration */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
              <p className="text-sm text-gray-500">Update where you receive your security alerts</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp / SMS Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                />
                <button
                  onClick={updatePhone}
                  disabled={updatingPhone || !phoneNumber}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-indigo-100"
                >
                  {updatingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Number'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Always include country code (e.g. +91). Messages will be sent here.</p>
            </div>
          </div>
        </div>

        {/* Twilio Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-black">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 text-black">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">Notification System</h2>
              <p className="text-sm text-gray-500">Verify and run manual expiry checks</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Verification Tools</h3>
              <p className="text-xs text-blue-700 mb-4 opacity-80">
                Use these to demo the platform connectivity or verify your phone setup.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => triggerTestAlert('test')}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Send Connectivity Test
                </button>

                <button
                  onClick={() => triggerTestAlert('report')}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Send Full Expiry Report
                </button>
              </div>

              {status && (
                <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold">{status.type === 'success' ? 'Confirmed' : 'Action Result'}</p>
                    <p className="opacity-90">{status.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Section (Demo Only) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden opacity-60">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security & Access</h2>
              <p className="text-sm text-gray-500">Security preferences for this demo account</p>
            </div>
          </div>
          <div className="p-6">
             <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700 font-medium">Two-Factor Authentication (2FA)</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full uppercase">Enabled</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
