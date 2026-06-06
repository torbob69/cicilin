import { useState } from 'react'
import { adminAPI } from '../services/api'

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby']

const RANK_XP: Record<string, string> = {
  Iron: '0–99', Bronze: '100–299', Silver: '300–599', Gold: '600–999',
  Platinum: '1000–1499', Diamond: '1500–1999', Ruby: '2000+',
}

interface DevUser {
  id: number
  full_name: string
  phone: string
  email: string
  rank: string
  xp: number
  is_verified: boolean
  is_active: boolean
  kyc_status: string
  default_on_file: string
  cred_hist_length: number
  created_at: string
  monthly_limit: number
  used_this_month: number
  remaining_this_month: number
}

const RANK_COLOR: Record<string, string> = {
  Iron: 'text-gray-400', Bronze: 'text-orange-400', Silver: 'text-gray-300',
  Gold: 'text-yellow-400', Platinum: 'text-cyan-300', Diamond: 'text-blue-400', Ruby: 'text-red-400',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', min, max }: {
  value: string | number; onChange: (v: string) => void
  type?: string; min?: number; max?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-[#2a2a2a]'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default function DevGodMode() {
  const [searchId, setSearchId] = useState('')
  const [user, setUser] = useState<DevUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Editable fields
  const [xp, setXp] = useState('')
  const [rank, setRank] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [kycStatus, setKycStatus] = useState('')
  const [defaultOnFile, setDefaultOnFile] = useState('N')
  const [credHistLength, setCredHistLength] = useState('')

  const loadUser = async () => {
    const id = parseInt(searchId)
    if (!id || id <= 0) { setError('Masukkan ID user yang valid'); return }
    setLoading(true)
    setError('')
    setSuccess('')
    setUser(null)
    try {
      const res = await adminAPI.devGetUser(id)
      const u = res.data as DevUser
      setUser(u)
      setXp(String(u.xp))
      setRank(u.rank)
      setIsVerified(u.is_verified)
      setIsActive(u.is_active)
      setKycStatus(u.kyc_status === 'no_kyc' ? 'pending' : u.kyc_status)
      setDefaultOnFile(u.default_on_file)
      setCredHistLength(String(u.cred_hist_length))
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'User tidak ditemukan')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload: Record<string, unknown> = {
        xp: parseInt(xp) || 0,
        rank,
        is_verified: isVerified,
        is_active: isActive,
        kyc_status: kycStatus,
        default_on_file: defaultOnFile,
        cred_hist_length: parseInt(credHistLength) || 0,
      }
      const res = await adminAPI.devOverrideUser(user.id, payload)
      const u = res.data as DevUser
      setUser(u)
      setSuccess(`User ${u.full_name} berhasil diupdate.`)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleResetMonthlyLimit = async () => {
    if (!user) return
    if (!confirm(`Reset monthly limit untuk ${user.full_name}? Semua pinjaman bulan ini yang belum dicairkan akan ditandai sebagai ditolak.`)) return
    setResetting(true)
    setError('')
    setSuccess('')
    try {
      const res = await adminAPI.devResetMonthlyLimit(user.id)
      const u = res.data as DevUser
      setUser(u)
      setSuccess(`Monthly limit ${u.full_name} berhasil direset. Sisa limit: Rp ${u.remaining_this_month.toLocaleString('id-ID')}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Gagal reset monthly limit')
    } finally {
      setResetting(false)
    }
  }

  const xpNum = parseInt(xp) || 0
  const derivedRank = xpNum >= 2000 ? 'Ruby' : xpNum >= 1500 ? 'Diamond' : xpNum >= 1000 ? 'Platinum'
    : xpNum >= 600 ? 'Gold' : xpNum >= 300 ? 'Silver' : xpNum >= 100 ? 'Bronze' : 'Iron'

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xl">⚡</span>
          <h1 className="text-white text-2xl font-black">DEV GOD MODE</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded">
            Dev Only
          </span>
        </div>
        <p className="text-gray-500 text-sm">Override data user secara langsung — gunakan hanya untuk development.</p>
      </div>

      {/* Search */}
      <div className="bg-surface border border-[#1f1f1f] rounded-xl p-5 mb-6">
        <p className="text-white text-sm font-semibold mb-3">Cari User by ID</p>
        <div className="flex gap-3">
          <input
            type="number"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUser()}
            placeholder="User ID..."
            className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors"
          />
          <button
            onClick={loadUser}
            disabled={loading}
            className="px-5 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* User panel */}
      {user && (
        <div className="bg-surface border border-[#1f1f1f] rounded-xl overflow-hidden">
          {/* User header */}
          <div className="px-6 py-4 bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1f1f1f] flex items-center justify-center text-white font-bold text-sm">
                {user.full_name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user.full_name}</p>
                <p className="text-gray-600 text-xs">{user.email} · ID #{user.id}</p>
              </div>
            </div>
            <span className={`text-sm font-bold ${RANK_COLOR[user.rank] ?? 'text-white'}`}>{user.rank}</span>
          </div>

          <div className="p-6 space-y-6">
            {/* XP + Rank */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="XP">
                <Input type="number" value={xp} onChange={setXp} min={0} />
                <p className="text-xs text-gray-600 mt-1">
                  Derived rank: <span className={`font-semibold ${RANK_COLOR[derivedRank]}`}>{derivedRank}</span>
                  {' '}({RANK_XP[derivedRank]})
                </p>
              </Field>
              <Field label="Rank Override">
                <Select
                  value={rank}
                  onChange={setRank}
                  options={RANKS.map((r) => ({ value: r, label: `${r} (${RANK_XP[r]})` }))}
                />
                <p className="text-xs text-gray-600 mt-1">Overrides rank independently of XP</p>
              </Field>
            </div>

            {/* Account state */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Is Verified">
                <div className="flex items-center gap-3 h-9">
                  <Toggle checked={isVerified} onChange={setIsVerified} label="is_verified" />
                  <span className="text-sm text-gray-400">{isVerified ? 'Verified' : 'Not verified'}</span>
                </div>
              </Field>
              <Field label="Is Active">
                <div className="flex items-center gap-3 h-9">
                  <Toggle checked={isActive} onChange={setIsActive} label="is_active" />
                  <span className="text-sm text-gray-400">{isActive ? 'Active' : 'Banned'}</span>
                </div>
              </Field>
            </div>

            {/* KYC */}
            <Field label="KYC Status">
              <Select
                value={kycStatus}
                onChange={setKycStatus}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </Field>

            {/* Credit history */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Default on File (cb_person_default_on_file)">
                <Select
                  value={defaultOnFile}
                  onChange={setDefaultOnFile}
                  options={[
                    { value: 'N', label: 'N — No default' },
                    { value: 'Y', label: 'Y — Has defaulted' },
                  ]}
                />
                <p className="text-xs text-gray-600 mt-1">Y → auto-rejected by ML model</p>
              </Field>
              <Field label="Credit History Length (years)">
                <Input type="number" value={credHistLength} onChange={setCredHistLength} min={0} max={99} />
              </Field>
            </div>

            {/* Monthly Limit */}
            <div className="border border-[#2a2a2a] rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Monthly Loan Limit (Bulan Ini)</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#0f0f0f] rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Limit</p>
                  <p className="text-white text-sm font-bold">Rp {user.monthly_limit.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-[#0f0f0f] rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Terpakai</p>
                  <p className="text-orange-400 text-sm font-bold">Rp {user.used_this_month.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-[#0f0f0f] rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Sisa</p>
                  <p className="text-green-400 text-sm font-bold">Rp {user.remaining_this_month.toLocaleString('id-ID')}</p>
                </div>
              </div>
              {user.monthly_limit > 0 && (
                <div className="w-full bg-[#1f1f1f] rounded-full h-1.5">
                  <div
                    className="bg-orange-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (user.used_this_month / user.monthly_limit) * 100)}%` }}
                  />
                </div>
              )}
              <button
                onClick={handleResetMonthlyLimit}
                disabled={resetting || user.used_this_month === 0}
                className="w-full px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-40 border border-orange-500/30 text-orange-400 text-sm font-semibold rounded-lg transition-colors"
              >
                {resetting ? 'Mereset...' : '↺ Reset Monthly Limit'}
              </button>
              <p className="text-xs text-gray-600">Menolak semua pinjaman bulan ini yang belum dicairkan, sehingga limit kembali penuh.</p>
            </div>

            {/* Divider */}
            <div className="border-t border-[#1f1f1f]" />

            {/* Save */}
            <div className="flex items-center justify-between">
              <div>
                {success && <p className="text-green-400 text-sm">{success}</p>}
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
