interface Props {
  status: string
  className?: string
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:        { label: 'Menunggu',      cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  approved:       { label: 'Disetujui',     cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  rejected:       { label: 'Ditolak',       cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  disbursed:      { label: 'Cair',          cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  closed:         { label: 'Lunas',         cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  manual_review:  { label: 'Tinjauan Manual', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  not_required:   { label: 'Otomatis',          cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  scoring:        { label: 'Penilaian',       cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
}

export default function StatusBadge({ status, className = '' }: Props) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls} ${className}`}>
      {label}
    </span>
  )
}
