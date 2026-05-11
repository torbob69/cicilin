import { useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

interface Stats {
  total_users: number;
  pending_kyc: number;
  pending_loans: number;
  total_loans: number;
  approved_loans: number;
  disbursed_loans: number;
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
    }}>
      <div style={{ fontSize: 13, color: 'var(--ink500)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink400)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.detail ?? 'Failed to load stats'));
  }, []);

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--ink500)', marginBottom: 32, fontSize: 14 }}>Overview of the platform</p>

      {error && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {!stats ? (
        <p style={{ color: 'var(--ink500)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          <StatCard label="Total Users" value={stats.total_users} color="var(--ink900)" />
          <StatCard label="Pending KYC" value={stats.pending_kyc} color="var(--amber)" sub="Awaiting review" />
          <StatCard label="Pending Loan Reviews" value={stats.pending_loans} color="var(--amber)" sub="Manual review queue" />
          <StatCard label="Total Loans" value={stats.total_loans} color="var(--ink900)" />
          <StatCard label="Approved Loans" value={stats.approved_loans} color="var(--mint)" />
          <StatCard label="Disbursed Loans" value={stats.disbursed_loans} color="var(--mint)" sub="Funds sent" />
        </div>
      )}
    </Layout>
  );
}
