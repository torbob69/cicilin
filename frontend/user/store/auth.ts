import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  phone: string;
  email: string;
  full_name: string;
  rank: string;
  xp: number;
  is_verified: boolean;
  nik?: string;
  date_of_birth?: string;
  address?: string;
  home_ownership?: string;
  cb_person_cred_hist_length?: number;
  created_at: string;
}

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  loadTokens: () => Promise<{ access: string | null; refresh: string | null }>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: true,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ accessToken: null, refreshToken: null, user: null });
  },

  loadTokens: async () => {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    set({ accessToken: access, refreshToken: refresh, isLoading: false });
    return { access, refresh };
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
