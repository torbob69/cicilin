import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.1.2:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('[API]', config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log('[API OK]', res.status, res.config.url);
    return res;
  },
  async (error) => {
    console.log('[API ERR]', error.message, error.config?.url, error.response?.status);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { phone: string; email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  verifyOTP: (phone: string, code: string, purpose: string) =>
    api.post('/auth/verify-otp', { phone, code, purpose }),
  resendOTP: (phone: string) =>
    api.post('/auth/resend-otp', { phone }),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userAPI = {
  getMe: () => api.get('/users/me'),
  getRank: () => api.get('/users/me/rank'),
  updateMe: (data: Partial<{ address: string; home_ownership: string; cb_person_cred_hist_length: number }>) =>
    api.put('/users/me', data),
  setPin: (pin: string) => api.post('/users/me/set-pin', { pin }),
  getKYCStatus: () => api.get('/users/kyc/status'),
  uploadKTP: (file: { uri: string; fileName?: string; mimeType?: string }) =>
    uploadFile('/users/kyc/upload-ktp', file),
  uploadKK: (file: { uri: string; fileName?: string; mimeType?: string }) =>
    uploadFile('/users/kyc/upload-kk', file),
  uploadSelfie: (file: { uri: string; fileName?: string; mimeType?: string }) =>
    uploadFile('/users/kyc/upload-selfie', file),
  uploadBankLetter: (file: { uri: string; fileName?: string; mimeType?: string }) =>
    uploadFile('/users/kyc/upload-bank-letter', file),
  upsertEmployment: (data: {
    occupation?: string;
    employer_name?: string;
    job_title?: string;
    emp_length?: number;
    annual_income?: number;
  }) => api.put('/users/employment', data),
  addBankAccount: (data: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_primary?: boolean;
  }) => api.post('/users/bank-account', data),
  listBankAccounts: () => api.get('/users/bank-accounts'),
};

// ── Loans ─────────────────────────────────────────────────────────────────────

export const loanAPI = {
  apply: (data: { loan_amnt: number; loan_intent: string; tenure_months: number; pin: string }) =>
    api.post('/loans/apply', data),
  list: (tab = 'all') => api.get(`/loans/?tab=${tab}`),
  get: (id: number) => api.get(`/loans/${id}`),
  acceptOffer: (id: number, pin: string) =>
    api.post(`/loans/${id}/accept-offer`, { pin }),
  listRepayments: (id: number) => api.get(`/loans/${id}/repayments`),
  pay: (loanId: number, repaymentId: number) =>
    api.post(`/loans/${loanId}/repayments/${repaymentId}/pay`),
};

// ── Quests & Leaderboard ──────────────────────────────────────────────────────

export const questAPI = {
  getActive: () => api.get('/quests/active'),
};

export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadFile(
  endpoint: string,
  file: { uri: string; fileName?: string; mimeType?: string }
) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.fileName || 'upload.jpg',
    type: file.mimeType || 'image/jpeg',
  } as unknown as Blob);
  return api.post(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export default api;
