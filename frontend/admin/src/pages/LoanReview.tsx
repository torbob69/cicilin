import { useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

interface LoanItem {
  id: string;
  user_id: string;
  user_name: string | null;
  loan_amnt: number;
  loan_intent: string;
  loan_grade: string | null;
  loan_int_rate: number | null;
  tenure_months: number;
  confidence: number | null;
  loan_status: string;
  review_status: string;
  review_note: string | null;
  created_at: string;
}

const INTENT_LABEL: Record<string, string> = {
  PERSONAL: 'Personal', EDUCATION: 'Education', MEDICAL: 'Medical',
  VENTURE: 'Business', HOMEIMPROVEMENT: 'Home Improvement', DEBTCONSOLIDATION: 'Debt Consolidation',
};

const STATUS_COLOR: Record<string, string> = {
  approved: 'var(--mint)', rejected: 'var(--red)', manual_review: 'var(--amber)',
  pending: 'var(--amber)', disbursed: 'var(--mint)', closed: 'var(--ink400)',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

export default function LoanReview() {
  const [items, setItems] = useState<LoanItem[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const endpoint = filter === 'pending' ? '/admin/loans/pending' : '/admin/loans/all';
    api.get(endpoint)
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, approved: boolean, note?: string) => {
    setActionId(id);
    try {
      await api.put(`/admin/loans/${id}/review`, { approved, review_note: note });
      load();
    } catch (e: any) {
      alert(e.response?.data?.detail ?? 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id: string) => {
    const note = prompt('Review note (optional):') ?? '';
    review(id, false, note || undefined);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Loan Review</h1>
          <p style={{ color: 'var(--ink500)', fontSize: 14, marginTop: 4 }}>Loan applications requiring manual review</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: filter === f ? 'var(--mint-dim)' : 'var(--surface)',
                border: `1px solid ${filter === f ? 'var(--mint)' : 'var(--border)'}`,
                color: filter === f ? 'var(--mint)' : 'var(--ink500)',
              }}
            >
              {f === 'pending' ? 'Pending Review' : 'All Loans'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink500)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink400)' }}>
          No loans in the {filter === 'pending' ? 'review queue' : 'system'}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>{item.user_name ?? 'Unknown User'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink400)', fontFamily: 'monospace' }}>{item.id}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: `${STATUS_COLOR[item.loan_status] ?? 'var(--ink400)'}22`,
                    color: STATUS_COLOR[item.loan_status] ?? 'var(--ink400)',
                  }}>
                    {item.loan_status.replace('_', ' ').toUpperCase()}
                  </span>
                  {item.loan_grade && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--surface)', color: 'var(--ink700)' }}>
                      Grade {item.loan_grade}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
                {[
                  { label: 'Amount', value: fmt(item.loan_amnt) },
                  { label: 'Purpose', value: INTENT_LABEL[item.loan_intent] ?? item.loan_intent },
                  { label: 'Tenure', value: `${item.tenure_months} months` },
                  { label: 'Interest Rate', value: item.loan_int_rate != null ? `${item.loan_int_rate.toFixed(2)}%` : '—' },
                  { label: 'AI Confidence', value: item.confidence != null ? `${(item.confidence * 100).toFixed(1)}%` : '—' },
                  { label: 'Applied', value: new Date(item.created_at).toLocaleDateString('id-ID') },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: 11, color: 'var(--ink400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {item.confidence != null && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${(item.confidence * 100).toFixed(1)}%`,
                      background: item.confidence >= 0.7 ? 'var(--mint)' : item.confidence >= 0.5 ? 'var(--amber)' : 'var(--red)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )}

              {item.review_note && (
                <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--ink500)', marginBottom: 16 }}>
                  Review note: {item.review_note}
                </div>
              )}

              {item.review_status === 'pending' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => review(item.id, true)}
                    disabled={actionId === item.id}
                    style={{
                      padding: '9px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                      background: 'var(--mint)', color: '#000',
                      opacity: actionId === item.id ? 0.6 : 1,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={actionId === item.id}
                    style={{
                      padding: '9px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                      background: 'var(--red-dim)', color: 'var(--red)',
                      border: '1px solid var(--red)',
                      opacity: actionId === item.id ? 0.6 : 1,
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
