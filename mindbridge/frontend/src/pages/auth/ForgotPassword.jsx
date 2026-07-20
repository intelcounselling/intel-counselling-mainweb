import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/axios';

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allMet = requirements.every(r => r.test(newPassword));
  const passwordsMatch = newPassword === confirm;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      success('If that account exists, a 6-digit OTP has been sent!');
      setStep(2);
    } catch (err) {
      const apiErr = err.response?.data?.error;
      if (apiErr && typeof apiErr === 'object') {
        setError(apiErr.message || JSON.stringify(apiErr));
      } else {
        setError(apiErr || 'Failed to send OTP code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }
    if (!allMet) {
      setError('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        email,
        otp,
        newPassword
      });
      success('Password successfully reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const apiErr = err.response?.data?.error;
      if (apiErr && typeof apiErr === 'object') {
        setError(apiErr.message || JSON.stringify(apiErr));
      } else {
        setError(apiErr || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative circles to match login style */}
      <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 opacity-10 blur-xl" />
      <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 opacity-10 blur-xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Reset Password</h1>
          <p className="text-surface-500 text-sm">
            {step === 1 
              ? 'Enter your email address to receive a secure 6-digit OTP.' 
              : 'Enter the 6-digit code sent to your email and choose a new password.'
            }
          </p>
        </div>

        <Card padding={true} className="shadow-card border border-surface-100 p-8 bg-white/85 backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-surface-400" />}
                autoFocus
              />

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                Send OTP Code
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {/* Email (readonly) */}
              <Input
                label="Email Address"
                type="email"
                value={email}
                disabled
                icon={<Mail className="w-4 h-4 text-surface-400" />}
              />

              {/* OTP */}
              <Input
                label="6-Digit OTP Code"
                type="text"
                required
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="form-input !pl-11 !pr-10"
                    placeholder="Create a strong password"
                    required
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
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={`form-input !pl-11 !pr-10 ${confirm && !passwordsMatch ? 'border-red-400' : ''}`}
                    placeholder="Repeat new password"
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
                loading={loading} disabled={!allMet || !passwordsMatch || otp.length !== 6}>
                Reset Password
              </Button>

              <div className="text-center pt-2">
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Step 1
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
