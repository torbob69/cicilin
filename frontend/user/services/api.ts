import axios, { AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token-refresh state ────────────────────────────────────────────────────
// Prevents multiple concurrent 401 responses from each triggering a separate
// refresh request. All requests that fail while a refresh is in-flight are
// queued and replayed once the refresh resolves (or discarded on failure).
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(err: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (err) {
      p.reject(err);
    } else {
      p.resolve(token as string);
    }
  });
  failedQueue = [];
}

// ── Response interceptor — refresh on 401, then retry ─────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401 errors that haven't already been retried,
    // and skip refresh calls themselves to avoid infinite loops.
    const is401 = err.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");

    if (!is401 || originalRequest._retry || isRefreshEndpoint) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one and wait.
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token stored — the user must log in again.
        throw new Error("No refresh token available");
      }

      // Call the refresh endpoint with the stored refresh token in the body.
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Persist both new tokens.
      await AsyncStorage.setItem("access_token", access_token);
      if (newRefreshToken) {
        await AsyncStorage.setItem("refresh_token", newRefreshToken);
      }

      // Update the Authorization header on the default axios instance so
      // subsequent requests don't re-read from AsyncStorage unnecessarily.
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      processQueue(null, access_token);

      // Retry the original request with the fresh token.
      if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
      }
      return api(originalRequest);
    } catch (refreshErr) {
      // Refresh failed (token expired or revoked) — clear stored credentials
      // and let the app redirect to login via the auth store.
      processQueue(refreshErr, null);
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

      // Dynamically import the auth store to avoid circular dependency.
      const { useAuthStore } = await import("@/store/auth");
      useAuthStore.getState().logout();

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
