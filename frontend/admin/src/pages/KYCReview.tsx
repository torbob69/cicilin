import { useEffect, useState } from 'react';
import { BASE_URL, api } from '../api';
import Layout from '../components/Layout';

interface KYCItem {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  ktp_image_url: string | null;
  selfie_image_url: string | null;
  review_status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--amber)',
  approved: 'var(--mint)',
  rejected: 'var(--red)',
};

function ImagePreview({ url, label }: { url: string | null; label: string }) {
  if (!url || url === 'dev_placeholder') {
    return (
      <div style={{
        width: 200, height: 130, borderRadius: 10, background: 'var(--surface)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 6,
      }}>
        <span style={{ fontSize: 20 }}>🖼️</span>
        <span style={{ fontSize: 11, color: 'var(--ink400)' }}>{url === 'dev_placeholder' ? 'Dev placeholder' : 'No image'}</span>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={label}
        style={{ width: 200, height: 130, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </a>
  );
}

export default function KYCReview() {
  const [items, setItems] = useState<KYCItem[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const endpoint = filter === 'pending' ? '/admin/kyc/pending' : '/admin/kyc/all';
    api.get(endpoint)
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, approved: boolean, reason?: string) => {
    setActionId(id);
    try {
      await api.put(`/admin/kyc/${id}/review`, { approved, rejection_reason: reason });
      load();
    } catch (e: any) {
      alert(e.response?.data?.detail ?? 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt('Rejection reason (optional):') ?? '';
    review(id, false, reason || undefined);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>KYC Review</h1>
          <p style={{ color: 'var(--ink500)', fontSize: 14, marginTop: 4 }}>Identity verification submissions</p>
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
              {f === 'pending' ? 'Pending' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink500)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink400)' }}>
          No {filter === 'pending' ? 'pending' : ''} KYC submissions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.user_name ?? 'Unknown User'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink500)' }}>{item.user_email}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink400)', marginTop: 4, fontFamily: 'monospace' }}>{item.id}</div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  background: `${STATUS_COLOR[item.review_status]}22`,
                  color: STATUS_COLOR[item.review_status] ?? 'var(--ink500)',
                }}>
                  {item.review_status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>KTP Photo</div>
                  <ImagePreview url={item.ktp_image_url} label="KTP" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Selfie</div>
                  <ImagePreview url={item.selfie_image_url} label="Selfie" />
                </div>
              </div>

              {item.rejection_reason && (
                <div style={{ background: 'var(--red-dim)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
                  Rejection reason: {item.rejection_reason}
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
