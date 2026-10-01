// Small helpers for the localStorage-backed auth session (user + bearer token).
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

// Fired on login/logout so every useAuthUser() re-renders (same tab); the
// browser's own 'storage' event covers other tabs.
const AUTH_EVENT = 'auth-change';

// A result taken while signed out, to attach to the account after sign-in.
export const PENDING_RESULT_KEY = 'pending_result_claim';

export const AUTH_USER_KEY = 'auth_user';
export const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function getAuthUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    return saved && getAuthToken() ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function setAuthSession(user: any, token?: string | null) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Per-account state that must not leak to the next person on this device
// (e.g. one user's paid career order being attached to another's result).
const ACCOUNT_SCOPED_KEYS = [
  'career_paid', 'career_order_id', 'career_progress',
  'career_booked_session_mode', 'career_booked_date', 'career_booked_time',
  'assessment_registration',
];

// signOut=true for a deliberate logout. An expired token (401) only drops the
// session, so a paid-but-unfinished career order isn't lost on re-login.
export function clearAuthSession(signOut = false) {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  if (signOut) ACCOUNT_SCOPED_KEYS.forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// The signed-in user, kept in sync across components and tabs.
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser);
  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return user;
}

// After sign-in: start the session and attach any result taken while signed out.
export async function completeSignIn(user: AuthUser, token: string) {
  setAuthSession(user, token);
  let pending: string | null = null;
  try {
    pending = localStorage.getItem(PENDING_RESULT_KEY);
    localStorage.removeItem(PENDING_RESULT_KEY);
  } catch (e) {
    // storage unavailable — nothing to claim
  }
  if (pending) {
    await fetch('/api/link-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resultId: pending }),
    }).catch(() => {});
  }
}

// Returns headers for authenticated API calls; empty object when logged out.
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
