import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/auth'

const NAV = [
  { path: '/',       label: 'Dashboard',    icon: GridIcon },
  { path: '/kyc',    label: 'KYC Review',   icon: ShieldIcon },
  { path: '/loans',  label: 'Loan Review',  icon: FileIcon },
  { path: '/users',  label: 'Users',        icon: UsersIcon },
  { path: '/dev',    label: 'God Mode',     icon: ZapIcon },
]

export default function Sidebar() {
  const { admin, logout } = useAdminStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0f0f0f] border-r border-[#1a1a1a]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-green-400 tracking-tight">Cicilin</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => {
          const isDev = path === '/dev'
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? isDev
                      ? 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 pl-[10px]'
                      : 'bg-green-500/8 text-green-400 border-l-2 border-green-500 pl-[10px]'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? (isDev ? 'text-orange-400' : 'text-green-400') : 'text-gray-500'} />
                  {label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-4 py-4 border-t border-[#1a1a1a]">
        {admin && (
          <div className="mb-3 px-1">
            <p className="text-white text-sm font-semibold truncate">{admin.full_name}</p>
            <p className="text-gray-600 text-xs truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogoutIcon size={15} />
          Keluar
        </button>
      </div>
    </aside>
  )
}

// Inline SVG icon components
function GridIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function ShieldIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function FileIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function UsersIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function ZapIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>
  )
}
function LogoutIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
