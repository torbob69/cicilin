import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { formatDate, avatarColor } from '../utils/format'

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected'] as const
type FilterTab = typeof FILTER_TABS[number]

export default function KYCReview() {
  const qc = useQueryClient()
  const { show, ToastContainer } = useToast()
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modal, setModal] = useState<{ type: 'approve' | 'reject'; kycId: number } | null>(null)

  const { data: kycList = [], isLoading } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: () => adminAPI.getPendingKYC().then(r => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: number; decision: 'approved' | 'rejected'; reason?: string }) =>
      adminAPI.reviewKYC(id, decision, reason),
    onSuccess: (_, { decision }) => {
      qc.invalidateQueries({ queryKey: ['kyc-pending'] })
      show(decision === 'approved' ? 'KYC berhasil disetujui' : 'KYC berhasil ditolak', decision === 'approved' ? 'success' : 'error')
      setModal(null)
    },
    onError: () => show('Gagal melakukan review', 'error'),
  })

  const filtered = (kycList as any[]).filter((k) =>
    filter === 'all' ? true : k.review_status === filter
  )

  const DOC_FIELDS = [
    { key: 'ktp_image_url', label: 'KTP' },
    { key: 'kk_image_url', label: 'Kartu Keluarga' },
    { key: 'selfie_image_url', label: 'Selfie + KTP' },
    { key: 'bank_letter_url', label: 'Surat Bank' },
  ]

  return (
    <div className="p-8">
      <ToastContainer />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-black mb-1">Verifikasi KYC</h1>
          <p className="text-gray-500 text-sm">Verifikasi dokumen identitas pengguna</p>
        </div>
        <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-sm font-semibold px-3 py-1.5 rounded-full">
          {(kycList as any[]).filter((k: any) => k.review_status === 'pending').length} menunggu
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === t ? 'bg-green-500 text-black' : 'bg-surface2 text-gray-500 hover:text-white'
            }`}
          >
            {t === 'all' ? 'Semua' : t === 'pending' ? 'Menunggu' : t === 'approved' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface2 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-[#1f1f1f] rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="text-gray-500 text-sm">Tidak ada data KYC</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((kyc: any) => (
            <div key={kyc.id} className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-surface2/30 transition-colors"
                onClick={() => setExpanded(expanded === kyc.id ? null : kyc.id)}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${avatarColor(kyc.user?.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {(kyc.user?.full_name ?? 'U')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{kyc.user?.full_name ?? `User #${kyc.user_id}`}</p>
                  <p className="text-gray-600 text-xs">{kyc.user?.phone ?? '-'} · {formatDate(kyc.created_at)}</p>
                </div>

                {/* Doc indicators */}
                <div className="hidden sm:flex gap-1">
                  {DOC_FIELDS.map(({ key, label }) => (
                    <span
                      key={key}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        kyc[key] ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {label.split(' ')[0]}
                    </span>
                  ))}
                </div>

                <StatusBadge status={kyc.review_status} className="ml-2 flex-shrink-0" />

                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expanded === kyc.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded */}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expanded === kyc.id ? 'max-h-[800px]' : 'max-h-0'}`}>
                <div className="border-t border-[#1f1f1f] px-6 py-5 bg-[#0f0f0f]">
                  {/* Documents grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {DOC_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">{label}</p>
                        {kyc[key] ? (
                          <a href={kyc[key]} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={kyc[key]}
                              alt={label}
                              className="w-full h-28 object-cover rounded-lg border border-[#2a2a2a] hover:border-green-500/40 transition-colors"
                            />
                            <p className="text-green-400 text-xs mt-1 hover:underline">Buka foto ↗</p>
                          </a>
                        ) : (
                          <div className="w-full h-28 bg-surface2 rounded-lg border border-[#2a2a2a] flex items-center justify-center">
                            <p className="text-gray-700 text-xs text-center">Belum diupload</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {kyc.rejection_reason && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm"><span className="font-bold">Alasan penolakan:</span> {kyc.rejection_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {kyc.review_status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModal({ type: 'approve', kycId: kyc.id })}
                        className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full text-sm transition-all"
                      >
                        ✓ Setujui KYC
                      </button>
                      <button
                        onClick={() => setModal({ type: 'reject', kycId: kyc.id })}
                        className="flex items-center gap-2 px-5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold rounded-full text-sm border border-red-500/30 transition-all"
                      >
                        ✕ Tolak KYC
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={modal !== null}
        title={modal?.type === 'approve' ? 'Setujui KYC' : 'Tolak KYC'}
        message={modal?.type === 'approve'
          ? 'Pastikan semua dokumen valid sebelum menyetujui KYC pengguna ini.'
          : 'Tuliskan alasan penolakan yang jelas agar pengguna dapat memperbaiki dokumennya.'
        }
        confirmLabel={modal?.type === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        confirmClass={modal?.type === 'approve' ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}
        showTextarea={modal?.type === 'reject'}
        textareaPlaceholder="Alasan penolakan (cth: Foto KTP buram, tidak terbaca)"
        loading={reviewMutation.isPending}
        onCancel={() => setModal(null)}
        onConfirm={(note) => {
          if (!modal) return
          reviewMutation.mutate({
            id: modal.kycId,
            decision: modal.type === 'approve' ? 'approved' : 'rejected',
            reason: modal.type === 'reject' ? note : undefined,
          })
        }}
      />
    </div>
  )
}
