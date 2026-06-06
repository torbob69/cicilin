export const formatIDR = (amount: number) =>
  'Rp ' + Math.round(amount).toLocaleString('id-ID').replace(/,/g, '.')

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`

export const LOAN_INTENT_MAP: Record<string, string> = {
  PERSONAL: 'Keperluan Pribadi',
  VENTURE: 'Usaha/Bisnis',
  DEBTCONSOLIDATION: 'Konsolidasi Hutang',
  HOMEIMPROVEMENT: 'Renovasi Rumah',
  EDUCATION: 'Pendidikan',
  MEDICAL: 'Kesehatan',
}

export const LOAN_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  scoring: 'Scoring',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  manual_review: 'Manual Review',
  disbursed: 'Cair',
  closed: 'Lunas',
}

const AVATAR_COLORS = [
  'bg-green-600', 'bg-blue-600', 'bg-violet-600',
  'bg-orange-600', 'bg-pink-600', 'bg-teal-600', 'bg-amber-600',
]

export function avatarColor(name?: string | null): string {
  const code = name?.charCodeAt(0) ?? 65
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
