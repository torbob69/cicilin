import axios from 'axios'

const BASE = 'http://localhost:8000'

const api = axios.create({ baseURL: BASE, timeout: 15_000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const adminAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),

  // KYC
  getPendingKYC: () => api.get('/admin/kyc/pending'),
  reviewKYC: (kycId: number, decision: 'approved' | 'rejected', reason?: string) =>
    api.put(`/admin/kyc/${kycId}/review`, { decision, rejection_reason: reason }),

  // Loans
  getPendingLoans: () => api.get('/admin/loans/pending'),
  reviewLoan: (loanId: number, decision: 'approved' | 'rejected', note?: string) =>
    api.put(`/admin/loans/${loanId}/review`, { decision, review_note: note }),

  // Users
  getUsers: () => api.get('/admin/users'),

  // Dev God Mode
  devGetUser: (userId: number) => api.get(`/admin/dev/users/${userId}`),
  devOverrideUser: (userId: number, data: Record<string, unknown>) =>
    api.patch(`/admin/dev/users/${userId}`, data),
  devResetMonthlyLimit: (userId: number) =>
    api.post(`/admin/dev/users/${userId}/reset-monthly-limit`),
}

export default api
