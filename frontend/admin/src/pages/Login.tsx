import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { useAdminStore } from '../store/auth'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAdminStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Email dan password wajib diisi'); return }
    setError('')
    setLoading(true)
    try {
      const res = await adminAPI.login(email, password)
      const { access_token, refresh_token } = res.data
      setAuth(access_token, { email })
      navigate('/')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Login gagal. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-green-400 tracking-tight mb-1">Cicilin</h1>
          <p className="text-gray-500 text-sm">Panel administrasi</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-[#1f1f1f] rounded-2xl p-8">
          <h2 className="text-white text-xl font-bold mb-6">Masuk ke admin panel</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cicilin.com"
                className="w-full bg-bg border border-[#2a2a2a] rounded-xl text-white text-sm px-4 h-12 focus:outline-none focus:border-green-500/60 placeholder-gray-700 transition-colors"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-[#2a2a2a] rounded-xl text-white text-sm px-4 pr-12 h-12 focus:outline-none focus:border-green-500/60 placeholder-gray-700 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors text-sm"
                >
                  {showPw ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded-full transition-all text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
