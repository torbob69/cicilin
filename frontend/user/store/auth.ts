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
  login: (token: string) => Promise<void>;
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
        await get().fetchProfile();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (token: string) => {
    await AsyncStorage.setItem("access_token", token);
    set({ token, isAuthenticated: true });
    await get().fetchProfile();
  },

  logout: async () => {
    await AsyncStorage.removeItem("access_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await userService.getMe();
      set({ user: res.data });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        await AsyncStorage.removeItem("access_token");
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  setNewUser: (v) => set({ isNewUser: v }),
}));
