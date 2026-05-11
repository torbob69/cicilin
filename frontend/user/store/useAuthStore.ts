import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  pendingPhone: string;
  setToken: (access: string, refresh: string) => void;
  setPendingPhone: (phone: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  pendingPhone: '',
  setToken: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
  setPendingPhone: (phone) => set({ pendingPhone: phone }),
  logout: () => set({ accessToken: null, refreshToken: null }),
}));
