import { useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  kyc_status: string;
  created_at: string;
}

const KYC_COLOR: Record<string, string> = {
  approved: 'var(--mint)',
  pending: 'var(--amber)',
  rejected: 'var(--red)',
  none: 'var(--ink400)',
};

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Users</h1>
          <p style={{ color: 'var(--ink500)', fontSize: 14, marginTop: 4 }}>All registered users</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink500)' }}>Loading…</p>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Phone', 'KYC Status', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, color: 'var(--ink400)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--ink400)' }}>
                    No users found.
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500 }}>{u.full_name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink500)', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink500)', fontSize: 13 }}>{u.phone}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: `${KYC_COLOR[u.kyc_status] ?? 'var(--ink400)'}22`,
                      color: KYC_COLOR[u.kyc_status] ?? 'var(--ink400)',
                    }}>
                      {u.kyc_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink500)', fontSize: 13 }}>
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
