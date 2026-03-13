'use client'
import { useState } from 'react'
import BarcodeScanner from '@/components/entry/BarcodeScanner'
import { PlusCircle, MinusCircle, ScanLine } from 'lucide-react'

interface ActionButtonsProps {
  shopId: string
}

export default function ActionButtons({ shopId }: ActionButtonsProps) {
  const [activeModal, setActiveModal] = useState<'add' | 'sell' | 'scan' | null>(null)

  const closeModal = () => setActiveModal(null)

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setActiveModal('scan')}
          className="flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 p-4 rounded-xl border border-blue-200 transition-all shadow-sm active:scale-[0.97]"
        >
          <ScanLine className="w-7 h-7" />
          <span className="font-semibold text-sm">Scan Product</span>
        </button>
        <button
          onClick={() => setActiveModal('add')}
          className="flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 p-4 rounded-xl border border-emerald-200 transition-all shadow-sm active:scale-[0.97]"
        >
          <PlusCircle className="w-7 h-7" />
          <span className="font-semibold text-sm">Add Manual</span>
        </button>
        <button
          onClick={() => setActiveModal('sell')}
          className="flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 p-4 rounded-xl border border-amber-200 transition-all shadow-sm active:scale-[0.97]"
        >
          <MinusCircle className="w-7 h-7" />
          <span className="font-semibold text-sm">Sell / Remove</span>
        </button>
      </div>

      {/* Modal: Scan Product (primary flow — barcode scan → auto-fill → add) */}
      {activeModal === 'scan' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10">✕</button>
            <h3 className="text-xl font-bold mb-1 text-gray-900">📷 Scan Product</h3>
            <p className="text-sm text-gray-500 mb-4">Point your camera at a barcode to auto-fill product details</p>
            <BarcodeScanner shopId={shopId} defaultMode="add" onSuccess={closeModal} />
          </div>
        </div>
      )}

      {/* Modal: Add Manual Stock (form without camera) */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10">✕</button>
            <h3 className="text-xl font-bold mb-1 text-gray-900">📦 Add Stock Manually</h3>
            <p className="text-sm text-gray-500 mb-4">Enter product details without scanning</p>
            <BarcodeScanner shopId={shopId} defaultMode="add" disableScanner={true} onSuccess={closeModal} />
          </div>
        </div>
      )}

      {/* Modal: Sell / Remove Stock */}
      {activeModal === 'sell' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10">✕</button>
            <h3 className="text-xl font-bold mb-1 text-gray-900">🛒 Sell / Remove Stock</h3>
            <p className="text-sm text-gray-500 mb-4">Scan or enter a product to reduce inventory</p>
            <BarcodeScanner shopId={shopId} defaultMode="sell" onSuccess={closeModal} />
          </div>
        </div>
      )}
    </>
  )
}
