import api from "./api";

export const authService = {
  register: (data: {
    full_name: string;
    phone: string;
    email: string;
    password: string;
  }) => api.post("/auth/register", data),

  verifyOtp: (data: { phone: string; code: string; purpose: string }) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>("/auth/verify-otp", data),

  resendOtp: (data: { phone: string; purpose: string }) =>
    api.post("/auth/resend-otp", data),

  login: (data: { phone: string; password: string }) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>("/auth/login", data),

  refresh: (refreshToken: string) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>("/auth/refresh", {
      refresh_token: refreshToken,
    }),

  forgotPassword: (data: { phone: string }) =>
    api.post("/auth/forgot-password", data),

  resetPassword: (data: { phone: string; otp_code: string; new_password: string }) =>
    api.post("/auth/reset-password", data),
};
