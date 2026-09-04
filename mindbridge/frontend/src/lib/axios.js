import axios from 'axios';
import useAuthStore from '../store/authStore';

// Remove trailing slashes if the user accidentally added them in Vercel
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: cleanApiUrl ? `${cleanApiUrl}/api/portal/api` : '/api/portal/api',
  timeout: 30000,
});

import { auth } from './firebase';

// ── Request interceptor: attach access token ──────────────────
// Firebase persists its session, but `auth.currentUser` is null in a
// freshly-opened tab (window.open / ctrl+click) until Firebase finishes
// restoring it asynchronously. Reports and other links open in new tabs,
// so the interceptor must wait briefly for that restore before falling
// back to the local JWT store.
function waitForFirebaseUser(timeoutMs = 3000) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    let unsub = () => {};
    const timer = setTimeout(() => { unsub(); resolve(null); }, timeoutMs);
    unsub = auth.onAuthStateChanged((user) => {
      clearTimeout(timer);
      unsub();
      resolve(user);
    });
  });
}

api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Try Firebase token first
      const currentUser = await waitForFirebaseUser();
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch (err) {
      console.warn('Firebase token fetch failed', err);
    }
    
    // 2. Fallback to local JWT store
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh on 401 ────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Forced password reset ────────────────────────────────
    // Backend rejects most requests with 403 MUST_RESET_PASSWORD while a
    // user still has temporary credentials. Flag it in the auth store —
    // ProtectedRoute (src/utils/roleGuard.jsx) reacts to the flag and
    // client-side-navigates to /reset-password, and skips the redirect
    // when the user is already on that screen (no loop, no hard reload).
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'MUST_RESET_PASSWORD'
    ) {
      const { user, updateUser } = useAuthStore.getState();
      if (user && !user.mustResetPassword) {
        updateUser({ mustResetPassword: true });
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.code === 'TOKEN_EXPIRED'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, updateToken } = useAuthStore.getState();

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || ''}/api/portal/api/auth/refresh`,
          { refreshToken }
        );

        updateToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
