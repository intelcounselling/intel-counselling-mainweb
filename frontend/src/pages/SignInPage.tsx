import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiClient } from '../utils/api';
import { completeSignIn, useAuthUser } from '../utils/auth';
import GoogleSignInButton, { googleSignInEnabled } from '../components/GoogleSignInButton';

type Mode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

// Only same-site paths — never bounce users to an attacker-supplied URL.
const safeNext = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/my-results';

const inputClass =
  'w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-intel-dark outline-none focus:border-terracotta transition-colors';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const user = useAuthUser();

  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Already signed in (or just signed in) → continue where they were going
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err: any) {
      // Account exists but was never verified → straight to the code step
      if (err?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setMode('verify');
        setOtp('');
        setNotice(`Enter the 6-digit code we sent to ${email}.`);
      } else {
        if (err?.data?.retryAfterSeconds) setResendCooldown(err.data.retryAfterSeconds);
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = (credential: string) =>
    run(async () => {
      const data = await apiClient.post<any>('/api/google-login', { credential });
      await completeSignIn(data.user, data.token);
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (mode === 'login') {
        const data = await apiClient.post<any>('/api/login', { email, password });
        await completeSignIn(data.user, data.token);
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const data = await apiClient.post<any>('/api/register', { name, email, password });
        setMode('verify');
        setOtp('');
        setPassword('');
        setNotice(data.message || `We sent a verification code to ${email}.`);
        setResendCooldown(60);
      } else if (mode === 'verify') {
        if (otp.trim().length !== 6) throw new Error('Enter the 6-digit code from your email');
        const data = await apiClient.post<any>('/api/verify-email', { email, otp: otp.trim() });
        await completeSignIn(data.user, data.token);
      } else if (mode === 'forgot') {
        await apiClient.post('/api/forgot-password', { email });
        setMode('reset');
        setNotice(`If an account exists for ${email}, a 6-digit code has been sent.`);
      } else {
        if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
        await apiClient.post('/api/verify-otp', { email, otp, newPassword });
        setMode('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setNotice('Password reset. Please sign in.');
      }
    });
  };

  const resendVerification = () =>
    run(async () => {
      await apiClient.post('/api/resend-verification', { email });
      setNotice('A new verification code has been sent.');
      setResendCooldown(60);
    });

  const title = {
    login: 'Welcome back',
    register: 'Create your account',
    verify: 'Verify your email',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
  }[mode];

  const submitLabel = {
    login: 'Sign In',
    register: 'Create Account',
    verify: 'Verify & Continue',
    forgot: 'Send Code',
    reset: 'Reset Password',
  }[mode];

  return (
    <div className="min-h-screen bg-[#F7EBD3] pt-28 pb-16 px-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-[32px] shadow-xl border border-black/5">
        <div className="text-center mb-8">
          <span className="text-terracotta font-black text-[10px] uppercase tracking-[0.25em] block mb-3">Your Intel Counselling account</span>
          <h1 className="text-3xl font-black serif text-intel-dark mb-2">{title}</h1>
          <p className="text-sm text-intel-dark/60 font-light">
            One account for every assessment — your details and results are saved securely in one place.
          </p>
        </div>

        {(mode === 'login' || mode === 'register') && googleSignInEnabled && (
          <>
            <GoogleSignInButton onCredential={handleGoogle} onError={setError} />
            <div className="flex items-center gap-3 my-6 text-[10px] font-black uppercase tracking-widest text-intel-dark/30">
              <span className="flex-1 h-px bg-black/10" /> or with email <span className="flex-1 h-px bg-black/10" />
            </div>
          </>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-black/5 p-1 rounded-xl mb-5">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${mode === m ? 'bg-white text-intel-dark shadow-sm' : 'text-intel-dark/60 hover:text-intel-dark'}`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        )}

        {error && <div role="alert" className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-semibold text-center mb-4">{error}</div>}
        {notice && <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-100 font-semibold text-center mb-4">{notice}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <input required type="text" autoComplete="name" placeholder="Full name" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          )}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <input required type="email" autoComplete="email" placeholder="Email address" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          )}
          {(mode === 'login' || mode === 'register') && (
            <input
              required
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          )}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode('forgot')} className="text-[11px] text-terracotta hover:underline font-bold">
                Forgot password?
              </button>
            </div>
          )}
          {(mode === 'verify' || mode === 'reset') && (
            <input
              required
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              aria-label="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} tracking-[0.4em] text-center`}
            />
          )}
          {mode === 'verify' && (
            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={resendVerification}
              className="text-[11px] text-terracotta hover:underline font-bold disabled:opacity-40"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          )}
          {mode === 'reset' && (
            <>
              <input required type="password" autoComplete="new-password" placeholder="New password (min 8 characters)" aria-label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
              <input required type="password" autoComplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-intel-dark text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-black/90 mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {submitLabel}
          </button>

          {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <div className="text-center">
              <button type="button" onClick={() => switchMode('login')} className="text-[11px] text-intel-dark/60 hover:text-intel-dark underline font-bold">
                Back to sign in
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-intel-dark/40 flex items-center justify-center gap-1.5 mt-8">
          <ShieldCheck size={12} className="text-serene-green" /> Your data is encrypted and private
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
