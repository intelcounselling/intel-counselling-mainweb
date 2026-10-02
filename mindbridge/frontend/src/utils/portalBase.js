import useAuthStore from '../store/authStore';

// Individual (self-registered) clients reuse the student test-taking and result
// pages. Routes and API paths are mirrored under /individual, so the pages only
// need to know which prefix to use.
export default function usePortalBase() {
  return useAuthStore((s) => (s.user?.role === 'INDIVIDUAL' ? '/individual' : '/student'));
}

// The public website (terms, privacy, crisis support)
export const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || 'https://intelcounselling.com';
