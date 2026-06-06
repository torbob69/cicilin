import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import RankBadge from '../components/RankBadge'
import { formatIDR, formatDate, LOAN_INTENT_MAP } from '../utils/format'

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  color: string
  onClick?: () => void
  isLoading?: boolean
}

function StatCard({ label, value, icon, color, onClick, isLoading }: StatCardProps) {
  return (
    <div
      className={`bg-surface border border-[#1f1f1f] rounded-xl p-6 ${onClick ? 'cursor-pointer hover:border-[#2a2a2a] transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full ${color}`} />
      </div>
      {isLoading ? (
        <div className="h-9 w-16 bg-surface2 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-black text-white mb-1">{value}</p>
      )}
      <p className="text-gray-500 text-sm font-medium">{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: kycList, isLoading: kycLoading } = useQuery({ queryKey: ['kyc-pending'], queryFn: () => adminAPI.getPendingKYC().then(r => r.data) })
  const { data: loanList, isLoading: loanLoading } = useQuery({ queryKey: ['loans-pending'], queryFn: () => adminAPI.getPendingLoans().then(r => r.data) })
  const { data: users, isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: () => adminAPI.getUsers().then(r => r.data) })

  const pendingKYC = Array.isArray(kycList) ? kycList.filter((k: any) => k.review_status === 'pending') : []
  const pendingLoans = Array.isArray(loanList) ? loanList : []
  const totalUsers = Array.isArray(users) ? users.length : 0
  const disbursedLoans = Array.isArray(users) ? users.filter((u: any) => u.xp > 700).length : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-black mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Ringkasan aktivitas Cicilin hari ini</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Pengguna" value={totalUsers} icon="👥" color="bg-blue-400" isLoading={usersLoading} />
        <StatCard label="Verifikasi KYC" value={pendingKYC.length} icon="🛡️" color="bg-yellow-400" onClick={() => navigate('/kyc')} isLoading={kycLoading} />
        <StatCard label="Verifikasi Pinjaman" value={pendingLoans.length} icon="📋" color="bg-orange-400" onClick={() => navigate('/loans')} isLoading={loanLoading} />
        <StatCard label="Peminjam Aktif" value={disbursedLoans} icon="💰" color="bg-green-400" isLoading={usersLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent KYC */}
        <div className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
            <h2 className="text-white font-bold">KYC Menunggu Verifikasi</h2>
            <button onClick={() => navigate('/kyc')} className="text-green-400 text-sm hover:text-green-300 transition-colors">
              Lihat semua →
            </button>
          </div>
          <div className="divide-y divide-[#1f1f1f]">
            {pendingKYC.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600 text-sm">Tidak ada KYC menunggu verifikasi</div>
            ) : (
              pendingKYC.slice(0, 5).map((kyc: any) => (
                <div key={kyc.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{kyc.user?.full_name ?? `User #${kyc.user_id}`}</p>
                    <p className="text-gray-600 text-xs">{formatDate(kyc.created_at)}</p>
                  </div>
                  <StatusBadge status={kyc.review_status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Loan Review */}
        <div className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
            <h2 className="text-white font-bold">Pinjaman Menunggu Verifikasi Manual </h2>
            <button onClick={() => navigate('/loans')} className="text-green-400 text-sm hover:text-green-300 transition-colors">
              Lihat semua →
            </button>
          </div>
          <div className="divide-y divide-[#1f1f1f]">
            {pendingLoans.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600 text-sm">Tidak ada pinjaman menunggu Verifikasi</div>
            ) : (
              pendingLoans.slice(0, 5).map((loan: any) => (
                <div key={loan.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{formatIDR(loan.loan_amnt)}</p>
                    <p className="text-gray-600 text-xs">{LOAN_INTENT_MAP[loan.loan_intent] ?? loan.loan_intent} · {formatDate(loan.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {loan.confidence !== null && (
                      <span className={`text-xs font-bold ${loan.confidence >= 0.75 ? 'text-green-400' : loan.confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {(loan.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    <StatusBadge status={loan.review_status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
