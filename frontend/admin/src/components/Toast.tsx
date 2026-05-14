import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

const BG = { success: 'bg-green-500/90', error: 'bg-red-500/90', info: 'bg-[#252525]' }
const ICON = { success: '✓', error: '✕', info: 'ℹ' }

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-2xl border border-white/10 ${BG[type]} min-w-[280px] max-w-sm`}>
      <span className="text-lg font-bold">{ICON[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}

// Toast manager hook
import { useState, useCallback } from 'react'

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info' }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const show = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++counter
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  )

  return { show, ToastContainer }
}
