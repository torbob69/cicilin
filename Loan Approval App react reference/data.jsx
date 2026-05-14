// cicil.in data + mock ML prediction
// Indonesian copy & rupiah formatting.

const fmtRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const LOAN_INTENTS = [
  { id: 'PERSONAL',          label: 'Keperluan Pribadi' },
  { id: 'VENTURE',           label: 'Usaha/Bisnis' },
  { id: 'DEBTCONSOLIDATION', label: 'Konsolidasi Hutang' },
  { id: 'HOMEIMPROVEMENT',   label: 'Renovasi rumah' },
  { id: 'EDUCATION',         label: 'Pendidikan' },
  { id: 'MEDICAL',           label: 'Kesehatan' },
];

const DEADLINES = [
  { id: 1,  label: '1 bulan' },
  { id: 3,  label: '3 bulan' },
  { id: 6,  label: '6 bulan' },
  { id: 12, label: '12 bulan' },
  { id: 24, label: '24 bulan' },
];

// Sample history data (matches the figma)
const HISTORY = [
  { id: 'h1', amount: 3500000, status: 'ditolak',    date: '3 April 2026',  intent: 'VENTURE' },
  { id: 'h2', amount: 500000,  status: 'lunas',      date: '3 April 2026',  intent: 'PERSONAL' },
  { id: 'h3', amount: 1500000, status: 'diterima',   date: '3 April 2026',  intent: 'EDUCATION' },
  { id: 'h4', amount: 2500000, status: 'menunggu',   date: '2 April 2026',  intent: 'MEDICAL' },
  { id: 'h5', amount: 3500000, status: 'menunggak',  date: '3 April 2026',  intent: 'VENTURE', overdue: true },
];

// Leaderboard (matches figma)
const LEADERBOARD = [
  { rank: 1,  name: 'Ilham Basudara',  rankClass: 'gold' },
  { rank: 2,  name: 'Cannavaro Lie',   rankClass: 'gold' },
  { rank: 3,  name: 'Ilham Basudara',  rankClass: 'bronze' },
  { rank: 4,  name: 'Ilham Basudara' },
  { rank: 5,  name: 'Ilham Basudara' },
  { rank: 6,  name: 'Ilham Basudara' },
  { rank: 7,  name: 'Budi Gunawan', me: true },
  { rank: 8,  name: 'Ilham Basudara' },
  { rank: 9,  name: 'Ilham Basudara' },
  { rank: 10, name: 'Ilham Basudara' },
  { rank: 11, name: 'Ilham Basudara' },
];

// Static profile
const PROFILE = {
  name: 'Budi Gunawan',
  rank: 'Platinum',
  xpCurrent: 180,
  xpMax: 500,
  limitUsed: 0.55,
  data: {
    NIK: '3493248327421',
    NAMA: 'Budi Gunawan',
    UMUR: '28',
    PROFESI: 'Karyawan',
    'LAMA BEKERJA': '3 tahun',
    'NAMA BANK': 'BLU by BCA Digital',
    'PENGHASILAN (per tahun)': 'Rp 120.000.000',
    'STATUS DOMISILI': 'Rumah Sendiri',
    'Alamat': 'Jl. Merdeka No. 17',
    'NAMA PERUSAHAAN': 'PT. Cannafood',
  },
};

// Tier → interest rate (matches the "Bunga 12%" pill on Konfirmasi screen)
const TIER_RATES = {
  Bronze:  18,
  Silver:  15,
  Gold:    13,
  Platinum: 12,
  Diamond:  10,
  Champion:  8,
};

// === Mock ML prediction ===
// Inputs: loan_amnt, loan_intent, deadline (months), profile data.
// Returns: { status: 'diterima' | 'ditolak' | 'menunggu', score, finalTotal, rate }
function mockPredict(form, profile = PROFILE) {
  const ratePct = TIER_RATES[profile.rank] ?? 12;
  const monthlyRate = (ratePct / 100);
  // Simple total: principal + (principal * rate * deadline / 12)
  const total = form.loan_amnt + form.loan_amnt * monthlyRate * (form.deadline / 12);

  // Risk scoring
  let score = 70;
  // Loan-to-income ratio (using profile yearly income, parsed)
  const incomeM = 120e6; // Rp 120.000.000
  const ratio = form.loan_amnt / incomeM;
  if (ratio < 0.05) score += 18;
  else if (ratio < 0.15) score += 6;
  else if (ratio < 0.3) score -= 8;
  else score -= 20;
  // Intent
  const intentAdj = { VENTURE: -8, DEBTCONSOLIDATION: -5, PERSONAL: 0, HOMEIMPROVEMENT: +2, EDUCATION: +3, MEDICAL: +1 };
  score += intentAdj[form.loan_intent] ?? 0;
  // Deadline (very long = risky)
  if (form.deadline >= 24) score -= 4;
  if (form.deadline <= 3)  score += 2;

  score = Math.max(5, Math.min(98, Math.round(score)));
  const status = score >= 65 ? 'diterima' : score >= 45 ? 'menunggu' : 'ditolak';

  return {
    status, score,
    finalTotal: total,
    rate: ratePct,
    deadlineMonths: form.deadline,
  };
}

// Format a deadline expiry date (today + deadline months)
function formatExpiry(deadlineMonths) {
  const d = new Date();
  d.setMonth(d.getMonth() + deadlineMonths);
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

window.CData = { fmtRp, LOAN_INTENTS, DEADLINES, HISTORY, LEADERBOARD, PROFILE, TIER_RATES, mockPredict, formatExpiry };
