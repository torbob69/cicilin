import api from "./api";

export const userService = {
  getMe: () => api.get("/users/me"),

  updateMe: (data: Partial<{
    full_name: string;
    nik: string;
    date_of_birth: string;
    address: string;
    home_ownership: string;
    cb_person_cred_hist_length: number;
  }>) => api.put("/users/me", data),

  setPin: (pin: string) => api.post("/users/me/set-pin", { pin }),

  getRank: () => api.get("/users/me/rank"),

  getKycStatus: () => api.get("/users/kyc/status"),

  uploadKtp: (formData: FormData) =>
    api.post("/users/kyc/upload-ktp", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadKk: (formData: FormData) =>
    api.post("/users/kyc/upload-kk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadSelfie: (formData: FormData) =>
    api.post("/users/kyc/upload-selfie", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadBankLetter: (formData: FormData) =>
    api.post("/users/kyc/upload-bank-letter", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getEmployment: () => api.get("/users/employment"),

  updateEmployment: (data: {
    occupation: string;
    employer_name: string;
    job_title: string;
    emp_length: number;
    annual_income: number;
  }) => api.put("/users/employment", data),

  addBankAccount: (data: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  }) => api.post("/users/bank-account", data),

  getBankAccounts: () => api.get("/users/bank-accounts"),

  getLeaderboard: () => api.get("/leaderboard"),
};
