import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmClass?: string
  showTextarea?: boolean
  textareaPlaceholder?: string
  onConfirm: (note?: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmModal({
  open, title, message, confirmLabel = 'Konfirmasi',
  confirmClass = 'bg-green-500 hover:bg-green-600 text-black',
  showTextarea, textareaPlaceholder, onConfirm, onCancel, loading,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && showTextarea) textareaRef.current?.focus()
  }, [open, showTextarea])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{message}</p>

        {showTextarea && (
          <textarea
            ref={textareaRef}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm p-3 resize-none h-24 focus:outline-none focus:border-green-500/60 placeholder-gray-600 mb-4"
            placeholder={textareaPlaceholder ?? 'Tulis alasan...'}
          />
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(textareaRef.current?.value)}
            disabled={loading}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Memproses...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
