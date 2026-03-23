'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Mail, Lock, Store, Phone, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    shopName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.shopName.trim() || !form.email.trim() || !form.password || !form.phoneNumber.trim()) {
      setError('All fields are required / सभी फ़ील्ड ज़रूरी हैं')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters / पासवर्ड कम से कम 6 अक्षर का होना चाहिए')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match / पासवर्ड मेल नहीं खाते')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseBrowserClient()

      // Step 1: Sign up with Supabase Auth
      // The DB trigger (handle_new_user) will auto-create a row in public.profiles
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.shopName.trim(),
            shop_name: form.shopName.trim(),
            phone_number: form.phoneNumber.trim(),
          },
        },
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      if (data.user) {
        // Step 2: Create Shop record (for inventory system)
        const { error: shopError } = await supabase
          .from('Shop')
          .insert({
            name: form.shopName.trim(),
            whatsappNum: form.phoneNumber.trim(),
          })

        if (shopError) {
          console.warn('Shop creation warning:', shopError.message)
        }

        // Note: Profile row is auto-created by the DB trigger.
        // No manual profile insert needed.
      }

      setSuccess(true)

      if (data.session) {
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-10 shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Account Created! 🎉</h2>
            <p className="text-sm text-gray-400 mb-1">खाता बन गया!</p>
            <p className="text-gray-500 text-sm mt-4">
              Redirecting to dashboard...
            </p>
            <p className="text-gray-400 text-xs mt-1">
              If not redirected, check your email for confirmation.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-orange-600 hover:text-orange-700 text-sm font-bold transition-colors"
            >
              Go to Login / लॉगिन पर जाएं →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mb-6">
              <ShieldIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Join StockGuard
            </h1>
            <p className="text-xl text-emerald-100 mt-2 font-medium">स्टॉक गार्ड से जुड़ें</p>
          </div>
          
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Set up your shop inventory management in just 5 minutes. No app install needed.
          </p>
          <p className="text-sm text-white/60 mt-2">
            सिर्फ 5 मिनट में अपनी दुकान का स्टॉक मैनेजमेंट शुरू करें।
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">📱</div>
              <p className="text-white/90 text-sm">WhatsApp alerts for expiring stock</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">📷</div>
              <p className="text-white/90 text-sm">Scan barcode or photograph invoice</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">💰</div>
              <p className="text-white/90 text-sm">Track ₹ losses and recover returns</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">🏪</div>
              <p className="text-white/90 text-sm">Built for kirana & medical shops</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
              <ShieldIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">StockGuard</h1>
            <p className="text-xs text-gray-400 mt-0.5">स्टॉक गार्ड</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account / खाता बनाएं</h2>
            <p className="text-gray-400 text-sm mb-6">Set up your shop in minutes / मिनटों में शुरू करें</p>

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Name / दुकान का नाम</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.shopName}
                    onChange={(e) => updateForm('shopName', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    placeholder="e.g. Ram Medical Store"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email / ईमेल</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp Number / व्हाट्सएप नंबर</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => updateForm('phoneNumber', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                    placeholder="+919876543210"
                    disabled={loading}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Include country code / देश कोड लगाएं (+91)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password / पासवर्ड</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      placeholder="••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm / पुष्टि</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateForm('confirmPassword', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                      placeholder="••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account / खाता बनाएं
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account? / पहले से खाता है?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.99-5.11a2 2 0 0 1 2.72-.81C15 1.5 17 3 19 4a1 1 0 0 1 1 1z" />
    </svg>
  )
}
