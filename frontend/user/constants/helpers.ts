export const formatIDR = (amount: number): string => {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID').replace(/,/g, '.');
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const RANK_LOAN_LIMITS: Record<string, number> = {
  Ruby: 100_000_000,
  Diamond: 50_000_000,
  Platinum: 25_000_000,
  Gold: 10_000_000,
  Silver: 5_000_000,
  Bronze: 2_000_000,
  Iron: 0,
};

export const RANK_INTEREST_RATES: Record<string, number> = {
  Ruby: 6,
  Diamond: 9,
  Platinum: 12,
  Gold: 15,
  Silver: 18,
  Bronze: 24,
  Iron: 0,
};

export const RANK_XP_THRESHOLDS: Record<string, [number, number | null]> = {
  Iron: [0, 99],
  Bronze: [100, 299],
  Silver: [300, 599],
  Gold: [600, 999],
  Platinum: [1000, 1499],
  Diamond: [1500, 1999],
  Ruby: [2000, null],
};

export const LOAN_INTENT_MAP: Record<string, string> = {
  PERSONAL: 'Keperluan Pribadi',
  VENTURE: 'Usaha/Bisnis',
  DEBTCONSOLIDATION: 'Konsolidasi Hutang',
  HOMEIMPROVEMENT: 'Renovasi Rumah',
  EDUCATION: 'Pendidikan',
  MEDICAL: 'Kesehatan',
};

export const LOAN_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  scoring: 'Sedang dinilai',
  approved: 'Diterima',
  rejected: 'Ditolak',
  manual_review: 'Dalam review',
  disbursed: 'Cair',
  closed: 'Lunas',
};

export const LOAN_STATUS_COLOR: Record<string, string> = {
  pending: '#8a8a8a',
  scoring: '#8a8a8a',
  approved: '#22c55e',
  rejected: '#ef4444',
  manual_review: '#f59e0b',
  disbursed: '#3b82f6',
  closed: '#22c55e',
};
