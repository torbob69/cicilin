import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminStore {
  token: string | null
  admin: { id: number; email: string; full_name: string } | null
  setAuth: (token: string, admin: any) => void
  logout: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => {
        localStorage.setItem('admin_token', token)
        set({ token, admin })
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, admin: null })
      },
    }),
    { name: 'admin-auth' }
  )
)
