'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, User, Check, RefreshCw } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl: string | null
  fullName: string | null
  uploading: boolean
  onUpload: (file: File) => Promise<string | null>
}

export default function AvatarUpload({ currentUrl, fullName, uploading, onUpload }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview instantly
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setSuccess(false)

    // Upload
    const url = await onUpload(file)
    if (url) {
      setPreview(null) // Clear preview, real URL takes over
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const displayUrl = preview || currentUrl
  const initials = fullName
    ?.split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="relative group/avatar">
      {/* Container with High Depth */}
      <div className="relative z-10">
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] md:rounded-[48px] overflow-hidden border-[6px] md:border-[10px] border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] bg-slate-50 transition-transform duration-700 group-hover/avatar:scale-[1.02]">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={fullName || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {initials}
              </span>
            </div>
          )}

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 transition-all opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-2">
            <button
               type="button"
               onClick={() => fileInputRef.current?.click()}
               disabled={uploading}
               className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-900 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Photo</span>
          </div>
        </div>

        {/* Floating Success Indicator */}
        {success && (
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-2xl shadow-xl flex items-center justify-center animate-in zoom-in-50 duration-300">
             <Check className="w-5 h-5 text-white" />
          </div>
        )}
        
        {/* Quick Edit Float Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-black transition-all group-hover/avatar:rotate-12 hover:scale-110 disabled:opacity-50 z-20"
        >
          {uploading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Decorative Glow under avatar */}
      <div className="absolute inset-10 bg-orange-500/20 rounded-full blur-3xl -z-10 group-hover/avatar:bg-orange-500/30 transition-colors" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  )
}
