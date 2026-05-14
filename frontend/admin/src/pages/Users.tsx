import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import RankBadge from '../components/RankBadge'
import { formatIDR, formatDate } from '../utils/format'

export default function Users() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminAPI.getUsers().then(r => r.data),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users as any[]
    return (users as any[]).filter((u: any) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    )
  }, [users, search])

  const HOME_LABEL: Record<string, string> = {
    RENT: 'Sewa', OWN: 'Milik Sendiri', MORTGAGE: 'KPR', OTHER: 'Lainnya',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-black mb-1">Users</h1>
          <p className="text-gray-500 text-sm">{(users as any[]).length} pengguna terdaftar</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau nomor HP..."
          className="w-full bg-surface border border-[#1f1f1f] rounded-xl text-white text-sm pl-11 pr-4 h-11 focus:outline-none focus:border-green-500/40 placeholder-gray-700 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">×</button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-surface2 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-[#1f1f1f] rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 text-sm">{search ? 'Tidak ada hasil pencarian' : 'Belum ada pengguna'}</p>
        </div>
      ) : (
        <div className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[#0f0f0f] border-b border-[#1f1f1f]">
            {['Pengguna', 'Nomor HP', 'Rank', 'XP', 'KYC', 'Bergabung'].map((h) => (
              <p key={h} className="text-gray-600 text-xs font-semibold uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1f1f1f]">
            {filtered.map((user: any) => (
              <div key={user.id}>
                <div
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-6 py-4 hover:bg-surface2/30 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                >
                  {/* Name + email */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(user.full_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{user.full_name}</p>
                      <p className="text-gray-600 text-xs truncate">{user.email}</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm">{user.phone}</p>
                  <RankBadge rank={user.rank} />
                  <p className="text-white text-sm font-bold">{user.xp}</p>
                  <StatusBadge status={user.kyc_status ?? (user.is_verified ? 'approved' : 'pending')} />
                  <p className="text-gray-600 text-xs">{formatDate(user.created_at)}</p>
                </div>

                {/* Expanded detail */}
                {expanded === user.id && (
                  <div className="border-t border-[#1a1a1a] px-6 py-5 bg-[#0d0d0d] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                    {[
                      { label: 'NIK', value: user.nik ?? '-' },
                      { label: 'Tanggal Lahir', value: user.date_of_birth ? formatDate(user.date_of_birth) : '-' },
                      { label: 'Alamat', value: user.address ?? '-' },
                      { label: 'Status Tempat Tinggal', value: HOME_LABEL[user.home_ownership] ?? user.home_ownership ?? '-' },
                      { label: 'Panjang Riwayat Kredit', value: user.cb_person_cred_hist_length ? `${user.cb_person_cred_hist_length} tahun` : '-' },
                      { label: 'Terverifikasi', value: user.is_verified ? '✓ Ya' : '✕ Belum' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-white text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
