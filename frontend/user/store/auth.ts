import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService } from "@/services/users";

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  nik?: string;
  date_of_birth?: string;
  address?: string;
  home_ownership?: string;
  occupation?: string;
  employer_name?: string;
  job_title?: string;
  emp_length?: number;
  annual_income?: number;
  cb_person_cred_hist_length?: number;
  rank: string;
  xp: number;
  has_pin: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setNewUser: (v: boolean) => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isNewUser: false,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        set({ token, isAuthenticated: true });
        // fetchProfile will trigger a token refresh via the axios interceptor
        // if the stored access token has already expired. If the refresh also
        // fails (truly expired session), the interceptor calls logout() itself.
        await get().fetchProfile();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (token: string, refreshToken?: string) => {
    await AsyncStorage.setItem("access_token", token);
    if (refreshToken) {
      await AsyncStorage.setItem("refresh_token", refreshToken);
    }
    set({ token, isAuthenticated: true });
    await get().fetchProfile();
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await userService.getMe();
      set({ user: res.data });
    } catch (err: any) {
      // Do NOT hard-logout here on 401. The axios interceptor in api.ts will
      // attempt a token refresh and retry the request automatically. If the
      // refresh also fails, the interceptor calls logout() on our behalf.
      // Handling 401 here would race against that recovery path and cause an
      // unnecessary logout even when the refresh would have succeeded.
      console.warn("[fetchProfile] error:", err?.response?.status ?? err?.message);
    }
  },

  setNewUser: (v) => set({ isNewUser: v }),
}));
