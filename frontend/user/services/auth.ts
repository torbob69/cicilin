import api from "./api";

export const authService = {
  register: (data: {
    full_name: string;
    phone: string;
    email: string;
    password: string;
  }) => api.post("/auth/register", data),

  verifyOtp: (data: { phone: string; code: string; purpose: string }) =>
    api.post("/auth/verify-otp", data),

  resendOtp: (data: { phone: string; purpose: string }) =>
    api.post("/auth/resend-otp", data),

  login: (data: { phone: string; password: string }) =>
    api.post<{ access_token: string; token_type: string }>("/auth/login", data),

  refresh: () => api.post("/auth/refresh"),
};
