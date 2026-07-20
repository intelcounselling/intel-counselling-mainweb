import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Spinner } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { ROLE_DASHBOARDS } from '../../utils/roleGuard';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const setAuth = useAuthStore(s => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = new URLSearchParams(location.search).get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      try {
        // Try Firebase Auth First
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('../../lib/firebase');
        await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
        
        // Fetch user context from backend using the interceptor (which now attaches the Firebase token)
        const { data } = await api.get('/auth/me');
        // Our mock auth flow expects the token in data.accessToken if we were using JWT, 
        // but for Firebase we'll just store the user and let interceptors handle the token
        userData = { user: data.user, accessToken: null }; 
      } catch (fbErr) {
        console.warn('Firebase login failed or unconfigured, falling back to local auth:', fbErr);
        // Fallback to local JWT auth
        const { data } = await api.post('/auth/login', {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        userData = data;
      }

      setAuth(userData);

      if (userData.user.mustResetPassword) {
        navigate('/reset-password');
        return;
      }

      const dest = redirect || ROLE_DASHBOARDS[userData.user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const apiErr = err.response?.data?.error;
      if (apiErr && typeof apiErr === 'object') {
        setError(apiErr.message || JSON.stringify(apiErr));
      } else {
        setError(apiErr || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('../../lib/firebase');
      
      await signInWithPopup(auth, googleProvider);
      
      // Fetch user context from backend using the interceptor (which now attaches the Firebase token)
      const { data } = await api.get('/auth/me');
      const userData = { user: data.user, accessToken: null };
      
      setAuth(userData);

      if (userData.user.mustResetPassword) {
        navigate('/reset-password');
        return;
      }

      const dest = redirect || ROLE_DASHBOARDS[userData.user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, just ignore
        return;
      }
      const apiErr = err.response?.data?.error;
      if (apiErr === 'User not found or inactive') {
        setError('This Google account is not registered. Please use the email provided by your school.');
      } else if (apiErr && typeof apiErr === 'object') {
        setError(apiErr.message || JSON.stringify(apiErr));
      } else {
        setError(apiErr || err.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #000000 0%, #081220 50%, #03060c 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />

        <div className="p-10">
          <div className="mb-12">
            <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-20 w-auto object-contain" />
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Supporting student<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #38bdf8)' }}>
              mental health
            </span>
          </h2>
          <p className="text-primary-300 text-lg leading-relaxed">
            A comprehensive platform connecting students, families, and mental health professionals.
          </p>
        </div>

        <div className="p-10">


          <p className="text-primary-500 text-sm">
            © {new Date().getFullYear()} Intel Counselling. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-12 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900 mb-2">Welcome back</h1>
            <p className="text-surface-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  required
                  placeholder="you@school.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="form-input !pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-surface-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input !pl-11 !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-surface-200 lg:w-1/4"></span>
            <span className="text-xs text-center text-surface-500 uppercase">or sign in with</span>
            <span className="w-1/5 border-b border-surface-200 lg:w-1/4"></span>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full bg-white flex items-center justify-center gap-2 hover:bg-surface-50 transition-colors"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FcGoogle className="w-5 h-5" />
              <span>Google</span>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
