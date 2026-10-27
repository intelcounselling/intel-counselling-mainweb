import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, GraduationCap, Users, HeartHandshake, Sparkles, ShieldCheck, Sun, Moon, Heart, Star, Leaf, Brain } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '../../components/ui/Toast';
import { Button, Input, Spinner } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { ROLE_DASHBOARDS } from '../../utils/roleGuard';

// Firebase imports
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const setAuth = useAuthStore(s => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaToken, setMfaToken] = useState(null);
  const [welcome, setWelcome] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const GreetIcon = hour >= 6 && hour < 18 ? Sun : Moon;

  const redirect = new URLSearchParams(location.search).get('redirect');

  // Save the session, then play a short welcome before moving on
  const finish = (userData) => {
    setAuth(userData);
    const dest = userData.user.mustResetPassword
      ? '/reset-password'
      : redirect || ROLE_DASHBOARDS[userData.user.role] || '/';
    setWelcome({ firstName: userData.user.firstName, role: userData.user.role, dest });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      try {
        // Try Firebase Auth First
        await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
        
        // Fetch user context from backend using the interceptor (which now attaches the Firebase token)
        const { data } = await api.get('/auth/me');
        // Our mock auth flow expects the token in data.accessToken if we were using JWT, 
        // but for Firebase we'll just store the user and let interceptors handle the token
        userData = { user: data.user, accessToken: null }; 
      } catch (fbErr) {
        console.warn('Firebase login failed or unconfigured, falling back to local auth:', fbErr);
        // A half-finished Firebase session must not stand in for the password + code path
        await auth.signOut().catch(() => {});
        // Fallback to local JWT auth
        const { data } = await api.post('/auth/login', {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        if (data.mfaRequired) {
          setMfaToken(data.mfaToken);
          return;
        }
        userData = data;
      }

      finish(userData);
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
      await signInWithPopup(auth, googleProvider);
      
      // Fetch user context from backend using the interceptor (which now attaches the Firebase token)
      const { data } = await api.get('/auth/me');
      const userData = { user: data.user, accessToken: null };
      
      finish(userData);
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
    <div className="min-h-screen flex relative bg-surface-50 overflow-hidden">
      {welcome && <WelcomeSplash {...welcome} onDone={() => navigate(welcome.dest, { replace: true })} />}
      <a
        href="https://intelcounselling.com"
        className="absolute top-5 right-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-surface-200 bg-white text-sm font-semibold text-surface-700 hover:border-surface-300 hover:shadow-sm z-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Main website
      </a>

      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[500px] flex-shrink-0 relative overflow-hidden bg-[#1F1E1B]">
        <Sparkles className="blob-drift absolute top-40 right-14 w-7 h-7 text-accent-600/70" strokeWidth={1.5} />
        <Heart className="blob-drift-alt absolute top-[58%] right-10 w-6 h-6 text-[#E4A59A]/60" strokeWidth={1.5} />
        <Leaf className="blob-drift absolute bottom-40 right-20 w-7 h-7 text-sage/50" strokeWidth={1.5} />
        <Star className="blob-drift-alt absolute top-24 left-[55%] w-5 h-5 text-accent-600/50" strokeWidth={1.5} />

        <div className="relative p-10">
          <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-16 w-auto object-contain mb-14" />

          <p className="text-sm font-semibold text-accent-600 mb-3">School portal</p>
          <h2 className="font-serif text-5xl leading-[1.15] text-[#F4EFE6] mb-5">
            Supporting student <span className="italic text-accent-600">mental health</span>
          </h2>
          <p className="text-lg leading-relaxed text-white/65 max-w-sm">
            One calm place for students, families and counsellors to check in, understand and grow together.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              { icon: GraduationCap, tint: 'bg-lavender', title: 'Students', text: 'Take short, friendly assessments' },
              { icon: Users, tint: 'bg-sage', title: 'Families', text: 'See progress and book sessions' },
              { icon: HeartHandshake, tint: 'bg-peach', title: 'Counsellors', text: 'Spot who needs support early' },
            ].map(({ icon: Icon, tint, title, text }) => (
              <li key={title} className="group/item flex items-center gap-4 rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 hover:bg-white/10 hover:translate-x-1 transition-all duration-300">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-surface-900 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/item:-rotate-12 group-hover/item:scale-110 ${tint}`}><Icon className="w-5 h-5" /></span>
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="block text-sm text-white/55">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative p-10 flex items-center gap-2 text-sm text-white/45">
          <ShieldCheck className="w-4 h-4 text-accent-600" />
          Confidential and encrypted. © {new Date().getFullYear()} Intel Counselling
        </div>
      </div>

      {/* Right: sign-in */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-peach/70 blur-3xl blob-drift" />
        <div className="pointer-events-none absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-sky/70 blur-3xl blob-drift-alt" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <div className="bg-surface-900 p-4 rounded-3xl inline-flex shadow-lg items-center justify-center">
              <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-8 w-auto object-contain" />
            </div>
          </div>

          <div className="login-pop group/card relative">
            {/* Tilted pastel cards peeking out from behind; they swing out while you type */}
            <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-peach rotate-[3deg] translate-x-2 translate-y-2 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within/card:rotate-[6deg] group-focus-within/card:translate-x-4" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-sage -rotate-[2deg] -translate-x-1 translate-y-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within/card:-rotate-[5deg] group-focus-within/card:-translate-x-3" aria-hidden="true" />

            <div className="relative bg-[#FFFDF8] rounded-[32px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(26,26,26,0.14)]">
              <div className="mb-7">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 mb-2"><GreetIcon className="w-4 h-4 splash-wiggle" /> {greeting}!</p>
                <h1 className="font-serif text-4xl text-surface-900 mb-2">Sign in</h1>
                <p className="text-surface-500">Use the email your school gave you.</p>
              </div>

              {error && (
                <div role="alert" className="mb-5 p-4 bg-[#FBE3DF] rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {mfaToken ? (
                <MfaStep
                  mfaToken={mfaToken}
                  onCancel={() => setMfaToken(null)}
                  onDone={finish}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-surface-700 mb-1.5 ml-1">Email address</label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        required
                        placeholder="you@school.edu"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="peer form-input !pl-11"
                      />
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 peer-focus:text-accent-600 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                      <label htmlFor="password" className="block text-sm font-semibold text-surface-700">Password</label>
                      <Link to="/forgot-password" className="text-xs text-primary-700 hover:text-primary-900 font-semibold transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        required
                        placeholder="Your password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="peer form-input !pl-11 !pr-11"
                      />
                      <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 peer-focus:text-accent-600 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                    Sign in
                  </Button>
                </form>
              )}

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                <span className="flex-1 h-px bg-surface-200" />
                or
                <span className="flex-1 h-px bg-surface-200" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleLogin}
                aria-label="Sign in with Google"
                disabled={loading}
              >
                <FcGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Short hello after signing in: a circle of colour grows from the middle, the
// logo bounces in, the first name rises letter by letter and a handful of
// pastel confetti bursts out. Reduced-motion visitors just get a brief pause.
const LINES = {
  STUDENT: 'Ready to check in with yourself?',
  PARENT: 'Good to see you. Here is how things are going.',
  SUPER_ADMIN: 'Here is how everyone is doing today.',
  SCHOOL_ADMIN: 'Here is how your school is doing today.',
};
const CONFETTI = [
  ['#F6DCC8', -150, -110], ['#DCE8DC', 140, -120], ['#E6DEEC', -170, 20], ['#DCE6EE', 170, 40],
  ['#C19B6C', -90, 130], ['#F6DCC8', 100, 140], ['#E6DEEC', -40, -170], ['#DCE8DC', 30, 170],
  ['#C19B6C', 190, -40], ['#DCE6EE', -200, -50], ['#F6DCC8', 60, -150], ['#DCE8DC', -120, 90],
];

function WelcomeSplash({ firstName, role, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const name = String(firstName || 'there');

  useEffect(() => {
    const leave = setTimeout(() => setLeaving(true), reduced ? 500 : 2100);
    const done = setTimeout(onDone, reduced ? 700 : 2600);
    return () => { clearTimeout(leave); clearTimeout(done); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#1F1E1B] splash-reveal transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="splash-glow absolute w-[480px] h-[480px] rounded-full bg-accent-600/20 blur-3xl" />

      <div className="relative flex flex-col items-center text-center px-6">
        <div className="relative">
          {!reduced && CONFETTI.map(([color, dx, dy], i) => (
            <span
              key={i}
              className="splash-confetti absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
              style={{ background: color, '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.45 + i * 0.03}s` }}
            />
          ))}
          <div className="splash-logo w-24 h-24 rounded-[28px] bg-primary-800 border border-white/10 flex items-center justify-center shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
            <Brain className="w-11 h-11 text-accent-600" strokeWidth={1.6} />
          </div>
        </div>

        <p className="splash-rise mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-accent-600" style={{ animationDelay: '0.35s' }}>Welcome back</p>
        <h2 className="mt-2 font-serif text-5xl md:text-6xl text-[#F4EFE6] leading-tight" aria-label={name}>
          {[...name].map((ch, i) => (
            <span key={i} aria-hidden="true" className="splash-rise inline-block" style={{ animationDelay: `${0.5 + i * 0.05}s`, whiteSpace: 'pre' }}>{ch}</span>
          ))}
        </h2>
        <p className="splash-rise mt-4 max-w-sm text-lg text-white/60" style={{ animationDelay: `${0.7 + name.length * 0.05}s` }}>
          {LINES[role] || 'Taking you to your dashboard.'}
        </p>

        <div className="mt-8 flex gap-2" aria-hidden="true">
          {['#F6DCC8', '#DCE8DC', '#E6DEEC'].map((c, i) => (
            <span key={c} className="splash-dot w-2.5 h-2.5 rounded-full" style={{ background: c, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Second sign-in step for the super admin: the code emailed after the password
function MfaStep({ mfaToken, onDone, onCancel }) {
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post('/auth/login/verify', { mfaToken, otp });
      onDone(data);
    } catch (e2) {
      setErr(e2.response?.data?.error || 'That code is not right. Please try again.');
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-surface-600">We emailed a 6-digit code to your admin address. Enter it to finish signing in.</p>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        aria-label="Sign-in code"
        className="form-input tracking-[0.4em] text-xl text-center font-serif"
        required
      />
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={otp.length !== 6}>Verify and sign in</Button>
      <button type="button" onClick={onCancel} className="w-full text-sm font-semibold text-surface-500 hover:text-surface-800 underline underline-offset-4">Start again</button>
    </form>
  );
}
