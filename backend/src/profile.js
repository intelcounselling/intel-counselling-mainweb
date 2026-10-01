import { encrypt, decrypt } from './encryption.js';
import { getAccountById } from './db.js';

// Intake details collected once per account (health-adjacent data — stored
// encrypted, never logged). Name/email come from the account itself.
export const PROFILE_KEYS = ['phone', 'age', 'gender', 'occupation', 'reason'];
const REQUIRED_KEYS = ['phone', 'age', 'gender', 'occupation'];

// Returns { profile } or { error } for untrusted client input.
export function sanitizeProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid profile' };
  const profile = {};
  for (const key of PROFILE_KEYS) {
    const value = input[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' && typeof value !== 'number') return { error: 'Invalid profile' };
    profile[key] = String(value).trim().slice(0, key === 'reason' ? 1000 : 100);
  }
  const age = Number(profile.age);
  if (profile.age && (!Number.isInteger(age) || age < 5 || age > 120)) return { error: 'Please enter a valid age' };
  return { profile };
}

export function isProfileComplete(profile) {
  return !!profile && REQUIRED_KEYS.every((k) => profile[k]);
}

export function encryptProfile(profile) {
  return encrypt(JSON.stringify(profile));
}

export function readProfile(account) {
  if (!account?.profile || !account?.profile_iv) return null;
  try {
    return JSON.parse(decrypt(account.profile, account.profile_iv));
  } catch (err) {
    console.error('Failed to decrypt profile for user', account.id);
    return null;
  }
}

// Registration snapshot stored with each result (used by the report emails).
export async function registrationFor(userId) {
  const account = await getAccountById(userId);
  if (!account) return null;
  const profile = readProfile(account) || {};
  return { ...profile, name: account.name, email: account.email, phone: account.phone || profile.phone };
}
