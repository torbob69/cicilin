import { useNavigate, useLocation } from 'react-router-dom';
import { clearToken, getAdminName } from '../api';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '▦' },
  { path: '/kyc', label: 'KYC Review', icon: '🪪' },
  { path: '/loans', label: 'Loan Review', icon: '📋' },
  { path: '/users', label: 'Users', icon: '👥' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const logout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--mint)', marginBottom: 2 }}>LoanApp</div>
          <div style={{ fontSize: 12, color: 'var(--ink500)' }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 4,
                background: pathname === n.path ? 'var(--mint-dim)' : 'transparent',
                color: pathname === n.path ? 'var(--mint)' : 'var(--ink500)',
                fontWeight: pathname === n.path ? 600 : 400,
                fontSize: 14,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--ink500)', padding: '0 12px 8px' }}>{getAdminName()}</div>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', borderRadius: 10,
              color: 'var(--red)', fontSize: 14,
              background: 'transparent',
            }}
          >
            ↩ Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
