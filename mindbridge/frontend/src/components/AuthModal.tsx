import React, { useState } from 'react';
import { X, Loader2, ShieldCheck, Mail, Lock, User, Phone } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            {mode === 'login' 
              ? 'Login to access your assessment results and reports.' 
              : 'Register to start assessment and track your career growth.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 outline-none focus:border-terracotta transition-colors text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Password</label>
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
              mode === 'login' ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/5 text-xs text-white/60">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('register')} 
                className="text-terracotta font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => setMode('login')} 
                className="text-terracotta font-bold hover:underline"
              >
                Login here
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
