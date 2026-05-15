import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/config";
import api from "./api";

async function readAsBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error("Failed to read file"));
    xhr.open("GET", uri);
    xhr.send();
  });
}

async function uploadFile(endpoint: string, fileUri: string): Promise<{ data: any }> {
  const token = await AsyncStorage.getItem("access_token");
  const blob = await readAsBlob(fileUri);

  const formData = new FormData();
  formData.append("file", blob, "upload.jpg");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    json = { detail: `Server error (${response.status})` };
  }

  if (!response.ok) {
    const err: any = new Error("Upload failed");
    err.response = { data: json, status: response.status };
    throw err;
  }
  return { data: json };
}

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

  changePin: (data: { current_pin: string; new_pin: string }) =>
    api.put("/users/me/change-pin", data),

  getRank: () => api.get("/users/me/rank"),

  getKycStatus: () => api.get("/users/kyc/status"),

  uploadKtp:        (uri: string) => uploadFile("/users/kyc/upload-ktp",         uri),
  uploadKk:         (uri: string) => uploadFile("/users/kyc/upload-kk",          uri),
  uploadSelfie:     (uri: string) => uploadFile("/users/kyc/upload-selfie",      uri),
  uploadBankLetter: (uri: string) => uploadFile("/users/kyc/upload-bank-letter", uri),

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
