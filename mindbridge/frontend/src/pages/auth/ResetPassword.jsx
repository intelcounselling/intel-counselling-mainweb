import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { ROLE_DASHBOARDS } from '../../utils/roleGuard';

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { user, updateUser } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allMet = requirements.every(r => r.test(newPassword));
  const passwordsMatch = newPassword === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allMet) { setError('Password does not meet all requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { newPassword });
      updateUser({ mustResetPassword: false });
      success('Password updated! Redirecting to your dashboard...');
      setTimeout(() => navigate(ROLE_DASHBOARDS[user.role] || '/'), 1200);
    } catch (err) {
      const apiErr = err.response?.data?.error;
      if (apiErr && typeof apiErr === 'object') {
        setError(apiErr.message || JSON.stringify(apiErr));
      } else {
        setError(apiErr || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Set Your Password</h1>
          <p className="text-surface-500 text-sm">
            Welcome, <strong>{user?.firstName}</strong>! You need to set a new password before continuing.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hidden email field for password managers */}
            <input type="email" name="email" value={user?.email || ''} autoComplete="username" className="hidden" readOnly />

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  id="new-password"
                  name="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="form-input !pl-11 !pr-10"
                  placeholder="Create a strong password"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requirements */}
            {newPassword && (
              <div className="bg-surface-50 rounded-xl p-4 space-y-2">
                {requirements.map(r => {
                  const met = r.test(newPassword);
                  return (
                    <div key={r.label} className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${met ? 'text-green-500' : 'text-surface-300'}`} />
                      <span className={`text-xs ${met ? 'text-green-700' : 'text-surface-500'}`}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={`form-input !pl-11 !pr-10 ${confirm && !passwordsMatch ? 'border-red-400' : ''}`}
                  placeholder="Repeat your password"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full"
              loading={loading} disabled={!allMet || !passwordsMatch}>
              Set Password & Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
