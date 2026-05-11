import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAdminName, setToken } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@loanapp.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      setToken(res.data.access_token);
      setAdminName(res.data.admin_name ?? 'Admin');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a',
    }}>
      <div style={{
        width: 380,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--mint)', marginBottom: 4 }}>LoanApp</div>
          <div style={{ fontSize: 14, color: 'var(--ink500)' }}>Admin Panel</div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink500)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink500)', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-dim)', padding: '10px 14px', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 15,
              background: loading ? 'rgba(111,207,151,0.4)' : 'var(--mint)',
              color: '#000', marginTop: 4,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
