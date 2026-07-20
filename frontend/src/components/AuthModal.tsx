import React, { useState } from 'react';
import { X, Loader2, ShieldCheck, Mail, Lock, User, Phone } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'reset';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      try {
        const response = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to send OTP';
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.error || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }
        setSuccessMsg('OTP code sent! Check your email (or dev logs).');
        setMode('reset');
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword })
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to verify OTP';
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.error || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }
        setSuccessMsg('Password reset successfully! Please login.');
        setMode('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const url = mode === 'login' ? '/api/login' : '/api/register';
    const body = mode === 'login' 
      ? { email, password } 
      : { name, email, password, phone };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Authentication failed';
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success || data.user) {
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        // Also pre-populate assessment registration details
        localStorage.setItem('assessment_registration', JSON.stringify({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          age: '',
          gender: ''
        }));
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-[#1F1E1B] rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-terracotta/20 text-terracotta rounded-2xl flex items-center justify-center mx-auto mb-4 border border-terracotta/20">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-2xl font-bold serif text-white">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Enter New Password'}
          </h3>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            {mode === 'login' 
              ? 'Login to access your assessment results and reports.' 
              : mode === 'register' ? 'Register to start assessment and track your career growth.'
              : mode === 'forgot' ? 'Enter your email address to receive a secure 6-digit OTP.'
              : 'Enter the 6-digit code sent to your email and choose a new password.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3 rounded-xl mb-6 text-center animate-in fade-in">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="tel"
                    placeholder="9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                required
                type="email"
                disabled={mode === 'reset'}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                    className="text-[10px] text-terracotta hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">6-Digit OTP Code</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm font-mono text-center tracking-widest text-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-terracotta text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Please wait...
              </>
            ) : (
              mode === 'login' ? 'Login' :
              mode === 'register' ? 'Register' :
              mode === 'forgot' ? 'Send OTP' : 'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/5 text-xs text-white/60">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }} 
                className="text-terracotta font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }} 
                className="text-terracotta font-bold hover:underline"
              >
                Login here
              </button>
            </p>
          ) : (
            <button 
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }} 
              className="text-terracotta font-bold hover:underline"
            >
              Back to Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
