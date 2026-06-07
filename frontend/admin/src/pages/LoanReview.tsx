import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import RankBadge from '../components/RankBadge'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { formatIDR, formatDate, LOAN_INTENT_MAP, avatarColor } from '../utils/format'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
  B: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  C: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  D: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  E: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  F: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  G: 'bg-red-900/30 text-red-600 ring-1 ring-red-900/40',
}

export default function LoanReview() {
  const qc = useQueryClient()
  const { show, ToastContainer } = useToast()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modal, setModal] = useState<{ type: 'approve' | 'reject'; loanId: number } | null>(null)

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans-pending'],
    queryFn: () => adminAPI.getPendingLoans().then(r => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: 'approved' | 'rejected'; note?: string }) =>
      adminAPI.reviewLoan(id, decision, note),
    onSuccess: (_, { decision }) => {
      qc.invalidateQueries({ queryKey: ['loans-pending'] })
      show(decision === 'approved' ? 'Pinjaman disetujui' : 'Pinjaman ditolak', decision === 'approved' ? 'success' : 'error')
      setModal(null)
    },
    onError: () => show('Gagal melakukan review', 'error'),
  })

  function ConfidenceBar({ value }: { value: number }) {
    const pct = Math.round(value * 100)
    const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
    const textColor = pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'
    return (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-2.5 bg-surface2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-bold ${textColor} w-8 text-right`}>{pct}%</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <ToastContainer />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-black mb-1">Verifikasi Pinjaman</h1>
          <p className="text-gray-500 text-sm">Pinjaman yang memerlukan verifikasi manual (confidence &lt; 75%)</p>
        </div>
        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-sm font-semibold px-3 py-1.5 rounded-full">
          {(loans as any[]).length} menunggu
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-surface2 rounded-xl animate-pulse" />)}
        </div>
      ) : (loans as any[]).length === 0 ? (
        <div className="bg-surface border border-[#1f1f1f] rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">Tidak ada pinjaman menunggu verifikasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(loans as any[]).map((loan: any) => (
            <div key={loan.id} className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
              {/* Row */}
              <div
                className="flex flex-wrap items-center gap-4 px-6 py-4 cursor-pointer hover:bg-surface2/30 transition-colors"
                onClick={() => setExpanded(expanded === loan.id ? null : loan.id)}
              >
                {/* User info */}
                <div className={`w-8 h-8 rounded-full ${avatarColor(loan.user?.full_name)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {(loan.user?.full_name ?? 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{loan.user?.full_name ?? `User #${loan.user_id}`}</p>
                  <p className="text-gray-600 text-xs">{formatDate(loan.created_at)}</p>
                </div>

                {/* Amount */}
                <div className="text-right hidden sm:block">
                  <p className="text-white font-bold">{formatIDR(loan.loan_amnt)}</p>
                  <p className="text-gray-600 text-xs">{LOAN_INTENT_MAP[loan.loan_intent] ?? loan.loan_intent}</p>
                </div>

                {/* Grade */}
                <span className={`hidden md:flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${GRADE_COLOR[loan.loan_grade] ?? 'bg-surface2 text-white'}`}>
                  {loan.loan_grade}
                </span>

                {/* Confidence */}
                {loan.confidence !== null && loan.confidence !== undefined && (
                  <div className="hidden md:block">
                    <ConfidenceBar value={loan.confidence} />
                  </div>
                )}

                {/* ML decision */}
                <span className={`text-xs font-bold px-2 py-1 rounded-full hidden md:inline ${
                  loan.ml_score === 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  ML: {loan.ml_score === 0 ? 'Approve' : 'Reject'}
                </span>

                <StatusBadge status={loan.review_status} className="flex-shrink-0" />

                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expanded === loan.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded */}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expanded === loan.id ? 'max-h-[600px]' : 'max-h-0'}`}>
                <div className="border-t border-[#1f1f1f] px-6 py-5 bg-[#0f0f0f]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 mb-6">
                    {[
                      { label: 'Jumlah Pinjaman', value: formatIDR(loan.loan_amnt) },
                      { label: 'Tujuan', value: LOAN_INTENT_MAP[loan.loan_intent] ?? loan.loan_intent },
                      { label: 'Tenor', value: `${loan.tenure_months} bulan` },
                      { label: 'Cicilan/bulan', value: loan.monthly_installment ? formatIDR(loan.monthly_installment) : '-' },
                      { label: 'Bunga', value: `${loan.loan_int_rate}% p.a.` },
                      { label: 'Loan Grade', value: loan.loan_grade },
                      { label: '% Penghasilan', value: `${(loan.loan_percent_income * 100).toFixed(1)}%` },
                      { label: 'ML Confidence', value: loan.confidence !== null ? `${(loan.confidence * 100).toFixed(1)}%` : '-' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-white text-sm font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ML recommendation box */}
                  <div className={`mb-5 rounded-xl px-4 py-3 border ${
                    loan.ml_score === 0
                      ? 'bg-green-500/5 border-green-500/20 text-green-400'
                      : 'bg-red-500/5 border-red-500/20 text-red-400'
                  }`}>
                    <p className="text-sm font-semibold">
                      Rekomendasi ML: <strong>{loan.ml_score === 0 ? '✓ Setujui' : '✕ Tolak'}</strong>
                      {loan.confidence !== null && ` (confidence: ${(loan.confidence * 100).toFixed(1)}%)`}
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      {loan.confidence < 0.75 ? 'Confidence di bawah threshold 75% — memerlukan review manual.' : ''}
                    </p>
                  </div>

                  {loan.review_note && (
                    <div className="mb-4 bg-surface2 rounded-xl px-4 py-3">
                      <p className="text-gray-400 text-sm"><span className="font-bold text-white">Catatan:</span> {loan.review_note}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {loan.review_status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModal({ type: 'approve', loanId: loan.id })}
                        className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full text-sm transition-all"
                      >
                        ✓ Setujui Pinjaman
                      </button>
                      <button
                        onClick={() => setModal({ type: 'reject', loanId: loan.id })}
                        className="flex items-center gap-2 px-5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold rounded-full text-sm border border-red-500/30 transition-all"
                      >
                        ✕ Tolak Pinjaman
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={modal !== null}
        title={modal?.type === 'approve' ? 'Setujui Pinjaman' : 'Tolak Pinjaman'}
        message={modal?.type === 'approve'
          ? 'Pastikan semua data valid. Pinjaman akan segera diproses untuk pencairan.'
          : 'Berikan alasan penolakan yang jelas untuk pengguna.'
        }
        confirmLabel={modal?.type === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        confirmClass={modal?.type === 'approve' ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}
        showTextarea={modal?.type === 'reject'}
        textareaPlaceholder="Alasan penolakan..."
        loading={reviewMutation.isPending}
        onCancel={() => setModal(null)}
        onConfirm={(note) => {
          if (!modal) return
          reviewMutation.mutate({ id: modal.loanId, decision: modal.type === 'approve' ? 'approved' : 'rejected', note })
        }}
      />
    </div>
  )
}
