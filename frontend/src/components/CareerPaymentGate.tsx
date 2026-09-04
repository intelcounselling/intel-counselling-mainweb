import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Sparkles, Brain, Target, UserCheck, PhoneCall, Check, Monitor, MapPin, FileText, RotateCcw, BadgeCheck } from 'lucide-react';
import { setAuthSession } from '../utils/auth';
import { apiClient } from '../utils/api';
import { usePricing, formatPrice } from '../utils/pricing';

const formatResultDate = (value: string) => {
  try {
    const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return value;
  }
};

interface CareerPaymentGateProps {
  registration: any;
  onSuccess: () => void;
  onClose: () => void;
}

const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    if ((window as any).Cashfree) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CareerPaymentGate: React.FC<CareerPaymentGateProps> = ({ registration, onSuccess, onClose }) => {
  const navigate = useNavigate();
  const { demoMode, prices } = usePricing();
  const assessmentPrice = formatPrice(prices.career_assessment);
  const plusPrice = formatPrice(prices.career_assessment_plus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'assessment_only' | 'assessment_explanation'>('assessment_only');
  const [sessionMode, setSessionMode] = useState<'online' | 'inperson' | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Authentication states
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Ticks down the resend-cooldown once per second while it's active.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // --- Previous results + purchase entitlement for the signed-in user ------
  const [prevResults, setPrevResults] = useState<any[]>([]);
  const [entitled, setEntitled] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  // null = follow the entitlement default (packages hidden once entitled)
  const [packagesOverride, setPackagesOverride] = useState<boolean | null>(null);
  const showPackages = packagesOverride ?? !entitled;

  useEffect(() => {
    if (!user) {
      setPrevResults([]);
      setEntitled(false);
      setAccessLoading(false);
      setPackagesOverride(null);
      return;
    }
    let alive = true;
    setAccessLoading(true);
    Promise.all([
      apiClient.get<any>('/api/user-results').catch(() => null),
      apiClient.get<any>('/api/career-access').catch(() => null),
    ]).then(([resultsRes, accessRes]) => {
      if (!alive) return;
      const all: any[] = resultsRes?.results || [];
      setPrevResults(all.filter((r: any) => (r.test_id || 'career') === 'career'));
      setEntitled(!!accessRes?.entitled);
      setAccessLoading(false);
    });
    return () => { alive = false; };
  }, [user?.id]);

  // Retake: entitlement is enforced server-side (career-access +
  // send-career-results); here we just skip the payment step.
  const handleRetake = () => {
    onSuccess();
  };

  const startResendCooldown = (seconds = 60) => setResendCooldown(seconds);

  const handleResendVerification = async () => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);
    try {
      await apiClient.post('/api/resend-verification', { email: authEmail });
      setAuthSuccessMsg('A new verification code has been sent to your email.');
      startResendCooldown(60);
    } catch (err: any) {
      // Honour the server's per-account cooldown if we raced ahead of it.
      if (err?.data?.retryAfterSeconds) {
        startResendCooldown(err.data.retryAfterSeconds);
      }
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (authMode === 'verify') {
      if (!authOtp || authOtp.trim().length !== 6) {
        setAuthError('Enter the 6-digit code from your email');
        setAuthLoading(false);
        return;
      }
      try {
        const data = await apiClient.post<any>('/api/verify-email', { email: authEmail, otp: authOtp.trim() });
        if (!data.user) {
          throw new Error(data.error || 'Verification failed. Please try again.');
        }
        setAuthSession(data.user, data.token);
        registration.name = data.user.name;
        registration.email = data.user.email;
        registration.phone = data.user.phone;
        localStorage.setItem('assessment_registration', JSON.stringify(registration));
        setUser(data.user);
      } catch (err: any) {
        setAuthError(err.message || 'Something went wrong');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (authMode === 'forgot') {
      try {
        await apiClient.post('/api/forgot-password', { email: authEmail });
        setAuthSuccessMsg(
          `If an account exists for ${authEmail}, a 6-digit code has been sent. Check your inbox and spam folder.`
        );
        setAuthMode('reset');
      } catch (err: any) {
        setAuthError(err.message || 'Something went wrong');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (authMode === 'reset') {
      if (authNewPassword !== authConfirmPassword) {
        setAuthError('Passwords do not match');
        setAuthLoading(false);
        return;
      }
      if (authNewPassword.length < 8) {
        setAuthError('Password must be at least 8 characters');
        setAuthLoading(false);
        return;
      }
      try {
        await apiClient.post('/api/verify-otp', { email: authEmail, otp: authOtp, newPassword: authNewPassword });
        setAuthSuccessMsg('Password reset successfully! Please login.');
        setAuthMode('login');
        setAuthPassword('');
        setAuthOtp('');
        setAuthNewPassword('');
        setAuthConfirmPassword('');
      } catch (err: any) {
        setAuthError(err.message || 'Something went wrong');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    const url = authMode === 'login' ? '/api/login' : '/api/register';
    const body = authMode === 'login'
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, phone: authPhone };

    try {
      const data = await apiClient.post<any>(url, body);

      // New registrations return no session — the user must confirm the
      // 6-digit code emailed to them first.
      if (authMode === 'register' && data.requiresVerification) {
        setAuthMode('verify');
        setAuthOtp('');
        setAuthPassword('');
        setAuthSuccessMsg(data.message || `We sent a verification code to ${authEmail}.`);
        startResendCooldown(60);
        return;
      }

      if (!data.user) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      setAuthSession(data.user, data.token);
      // update registration state
      registration.name = data.user.name;
      registration.email = data.user.email;
      registration.phone = data.user.phone;
      localStorage.setItem('assessment_registration', JSON.stringify(registration));
      setUser(data.user);
    } catch (err: any) {
      // Login rejected because the account exists but was never verified —
      // route the user into the verification step instead of a dead end.
      if (err?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setAuthMode('verify');
        setAuthOtp('');
        setAuthPassword('');
        setAuthSuccessMsg(`We sent a verification code to ${authEmail}. Enter it below to continue.`);
        return;
      }
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const availableSlots = date ? [
    '09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'
  ] : [];

  const handlePayment = async () => {
    if (selectedPackage === 'assessment_explanation' && (!sessionMode || !date || !time)) {
      setError("Please select your preferred consultation format and timing slot first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const isLoaded = await loadCashfreeScript();
    if (!isLoaded) {
      setError("Failed to load Cashfree script. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }

    try {
      const serviceId = selectedPackage === 'assessment_only' ? 'career_assessment' : 'career_assessment_plus';
      const serviceName = selectedPackage === 'assessment_only'
        ? 'Career Guidance Assessment (Assessment Only)'
        : 'Career Guidance Assessment (Assessment + Result Explanation)';

      // Create session on server side
      const data = await apiClient.post<any>('/api/create-cashfree-session', {
        serviceId: serviceId,
        serviceName: serviceName,
        customerName: registration.name,
        customerEmail: registration.email,
        customerPhone: registration.phone || '9999999999'
      });

      // Initialize Cashfree
      const cashfree = await (window as any).Cashfree({
        mode: "production", // Using production mode as configured in backend
      });

      let checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      };

      const orderId = data.orderId;

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          setError(result.error.message || "Payment transaction failed.");
          setIsProcessing(false);
          return;
        }

        if (result.redirect) {
          console.log("Payment redirecting...");
        }

        // Never trust the client-side checkout result alone — confirm the
        // order status with the server before unlocking the assessment.
        try {
          const verifyData = await apiClient.post<any>('/api/verify-payment', { orderId });

          if (verifyData.paid === true) {
            // Persist the verified order id so the assessment save can link the
            // result to this payment server-side (single-use).
            sessionStorage.setItem('career_order_id', orderId);
            // Success! Save selected appointment slot to localStorage
            if (selectedPackage === 'assessment_explanation') {
              localStorage.setItem('career_booked_session_mode', sessionMode);
              localStorage.setItem('career_booked_date', date);
              localStorage.setItem('career_booked_time', time);
            } else {
              localStorage.removeItem('career_booked_session_mode');
              localStorage.removeItem('career_booked_date');
              localStorage.removeItem('career_booked_time');
            }
            setIsProcessing(false);
            onSuccess();
          } else {
            setIsProcessing(false);
            setError("Payment was not completed or is pending verification. Please try again or contact us if you were charged.");
          }
        } catch (verifyErr) {
          console.error("Payment verification failed:", verifyErr);
          setIsProcessing(false);
          setError("Payment was not completed or is pending verification. Please try again or contact us if you were charged.");
        }
      }).catch((err: any) => {
        setError(err.message || "Payment encountered an error.");
        setIsProcessing(false);
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong initializing checkout.");
      setIsProcessing(false);
    }
  };

  const inclusions: { title: string; desc: string; icon: React.ReactNode; special?: boolean }[] = [
    {
      title: "Multiple Intelligence Mapping",
      desc: "Identify natural learning styles and cognitive strengths across 8 dimensions.",
      icon: <Brain className="text-terracotta" size={20} />
    },
    {
      title: "Vocational Interest Profile",
      desc: "Map your preferences across major career streams and domains.",
      icon: <Target className="text-terracotta" size={20} />
    },
    {
      title: "Career Personality Assessment",
      desc: "Evaluate working style, behavioral traits, and professional identity.",
      icon: <UserCheck className="text-terracotta" size={20} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F7F9] pt-20 md:pt-28 pb-12 px-4 flex items-center justify-center">
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-xl border border-black/5 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Value Proposition */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 bg-intel-dark text-white relative">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[100px] opacity-40"></div>
          
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors mb-10"
          >
            &larr; Back
          </button>

          <span className="text-terracotta font-black text-xs uppercase tracking-[0.25em] mb-4 block">Premium Suite</span>
          <h2 className="text-3xl md:text-5xl font-black serif !text-white leading-tight mb-8">
            Complete Career <br/>Guidance Portal.
          </h2>

          <div className="space-y-6">
            {inclusions.map((inc, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  inc.special 
                    ? 'bg-serene-green/10 border-serene-green/30 shadow-md' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  inc.special ? 'bg-serene-green/20' : 'bg-white/5'
                }`}>
                  {inc.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    {inc.title}
                    {inc.special && (
                      <span className="bg-serene-green text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Included</span>
                    )}
                  </h4>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed">{inc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Payment Detail & Auth */}
        <div className="w-full lg:w-[380px] p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-black/5 bg-[#FDFBF7]">
          {!user ? (
            <div className="space-y-4 my-auto">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-[10px] font-bold uppercase tracking-wider mb-3">
                  Account Required
                </div>
                <h4 className="font-bold text-lg text-intel-dark serif">Login or Register first</h4>
                <p className="text-xs text-intel-dark/60 mt-1">An account is required to start the assessment, save your progress, and access reports later.</p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-semibold text-center">
                  {authError}
                </div>
              )}

              {authSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-600 text-xs p-3 rounded-xl border border-emerald-100 font-semibold text-center">
                  {authSuccessMsg}
                </div>
              )}

              <div className="flex bg-black/5 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('register'); setAuthSuccessMsg(null); setAuthError(null); }} 
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-intel-dark shadow-sm' : 'text-intel-dark/60 hover:text-intel-dark'}`}
                >
                  Register
                </button>
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setAuthSuccessMsg(null); setAuthError(null); }} 
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-intel-dark shadow-sm' : 'text-intel-dark/60 hover:text-intel-dark'}`}
                >
                  Login
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <>
                    <input 
                      required 
                      type="text" 
                      placeholder="Full Name" 
                      value={authName} 
                      onChange={e => setAuthName(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      value={authPhone} 
                      onChange={e => setAuthPhone(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                  </>
                )}

                {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
                  <input 
                    required 
                    type="email" 
                    placeholder="Email Address" 
                    value={authEmail} 
                    onChange={e => setAuthEmail(e.target.value)} 
                    className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                  />
                )}

                {(authMode === 'login' || authMode === 'register') && (
                  <>
                    <input 
                      required 
                      type="password" 
                      placeholder="Password" 
                      value={authPassword} 
                      onChange={e => setAuthPassword(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                    {authMode === 'login' && (
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => { setAuthMode('forgot'); setAuthSuccessMsg(null); setAuthError(null); }} 
                          className="text-[10px] text-terracotta hover:underline font-bold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </>
                )}

                {authMode === 'verify' && (
                  <>
                    <div className="bg-terracotta/5 border border-terracotta/20 rounded-xl p-3 text-center">
                      <p className="text-[11px] text-intel-dark/70 font-semibold leading-relaxed">
                        We sent a 6-digit verification code to
                        <span className="text-terracotta font-black"> {authEmail}</span>
                      </p>
                    </div>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit Verification Code"
                      value={authOtp}
                      onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-sm tracking-[0.4em] text-center text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || authLoading}
                        onClick={handleResendVerification}
                        className="text-[10px] text-terracotta hover:underline font-bold disabled:opacity-40 disabled:hover:no-underline"
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthOtp(''); setAuthSuccessMsg(null); setAuthError(null); }}
                        className="text-[10px] text-intel-dark/60 hover:text-intel-dark underline font-bold"
                      >
                        Back to Login
                      </button>
                    </div>
                  </>
                )}

                {authMode === 'reset' && (
                  <>
                    <input 
                      required 
                      type="text" 
                      placeholder="6-digit OTP Code" 
                      value={authOtp} 
                      onChange={e => setAuthOtp(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                    <input 
                      required 
                      type="password" 
                      placeholder="New Password (min 8 chars)" 
                      value={authNewPassword} 
                      onChange={e => setAuthNewPassword(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                    <input 
                      required 
                      type="password" 
                      placeholder="Confirm New Password" 
                      value={authConfirmPassword} 
                      onChange={e => setAuthConfirmPassword(e.target.value)} 
                      className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                    />
                  </>
                )}
                
                <button 
                  type="submit" 
                  disabled={authLoading} 
                  className="w-full bg-intel-dark text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-black/90 mt-4 flex items-center justify-center gap-1.5 shadow-md"
                >
                  {authLoading && <Loader2 size={12} className="animate-spin" />}
                  {authMode === 'register' 
                    ? 'Register & Continue' 
                    : authMode === 'login' 
                      ? 'Login & Continue' 
                      : authMode === 'verify'
                        ? 'Verify Email & Continue'
                        : authMode === 'forgot' 
                          ? 'Send OTP Code' 
                          : 'Reset Password'}
                </button>

                {(authMode === 'forgot' || authMode === 'reset') && (
                  <div className="text-center mt-2">
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('login'); setAuthSuccessMsg(null); setAuthError(null); }} 
                      className="text-[10px] text-intel-dark/60 hover:text-intel-dark underline font-bold"
                    >
                      Back to Login
                    </button>
                  </div>
                )}
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/my-results')}
                  className="text-[10px] text-terracotta hover:underline font-bold"
                >
                  Already purchased? View & retake your results
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                {accessLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-intel-dark/40 text-[10px] font-black uppercase tracking-widest">
                    <Loader2 size={12} className="animate-spin" /> Checking your account...
                  </div>
                ) : (
                  <>
                    {entitled && (
                      <div className="p-5 rounded-2xl bg-serene-green/10 border border-serene-green/30 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <BadgeCheck size={14} className="text-serene-green" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-serene-green">Access Active</span>
                        </div>
                        <p className="text-xs text-intel-dark/70 font-medium leading-relaxed mb-4">
                          You already own the Career Guidance Assessment. Retake it anytime — no payment needed.
                        </p>
                        <button
                          onClick={handleRetake}
                          className="w-full bg-serene-green text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
                        >
                          <RotateCcw size={12} /> Retake Test — Free
                        </button>
                      </div>
                    )}

                    {prevResults.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <FileText size={12} className="text-intel-dark/40" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-intel-dark/40">Previous Results</span>
                          </div>
                          <button
                            onClick={() => navigate('/my-results')}
                            className="text-[9px] text-terracotta hover:underline font-black uppercase tracking-widest"
                          >
                            My Results
                          </button>
                        </div>
                        <div className="space-y-2">
                          {prevResults.map(r => (
                            <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-white border border-black/5 rounded-xl">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-intel-dark truncate">Career Guidance Assessment</p>
                                <p className="text-[10px] text-intel-dark/50 font-medium">{formatResultDate(r.created_at)}</p>
                              </div>
                              {r.order_id && (
                                <span className="shrink-0 bg-serene-green/10 text-serene-green text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-serene-green/30">Paid</span>
                              )}
                              <button
                                onClick={() => navigate(`/assessments/career?id=${encodeURIComponent(r.id)}`)}
                                className="shrink-0 px-4 py-2 bg-intel-dark text-white rounded-lg font-black uppercase tracking-widest text-[9px] hover:opacity-90 transition-opacity"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {entitled && !showPackages && (
                      <button
                        type="button"
                        onClick={() => setPackagesOverride(true)}
                        className="text-[10px] text-terracotta hover:underline font-bold"
                      >
                        Want the + Result Explanation add-on? Choose a package
                      </button>
                    )}
                  </>
                )}

                {showPackages && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-[10px] font-bold uppercase tracking-wider mb-8">
                  <Sparkles size={12} />
                  Select Package
                </div>
                )}
                
                {showPackages && (
                <>
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedPackage('assessment_only');
                        setSessionMode('');
                        setDate('');
                        setTime('');
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        selectedPackage === 'assessment_only' 
                          ? 'border-terracotta bg-terracotta/5 shadow-sm' 
                          : 'border-black/5 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs text-intel-dark">Assessment Only</span>
                        <span className="font-black text-sm text-terracotta">₹{assessmentPrice}</span>
                      </div>
                      <p className="text-[10px] text-intel-dark/60 leading-relaxed font-medium">Interest Test + Aptitude Test + Intelligence Test + Score Report (PDF)</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setSelectedPackage('assessment_explanation')}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        selectedPackage === 'assessment_explanation' 
                          ? 'border-terracotta bg-terracotta/5 shadow-sm' 
                          : 'border-black/5 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs text-intel-dark">Assessment + Result Explanation</span>
                        <span className="font-black text-sm text-terracotta">₹{plusPrice}</span>
                      </div>
                      <p className="text-[10px] text-intel-dark/60 leading-relaxed font-medium">Three tests + Detailed Report + 30–45 min interpretation session</p>
                    </button>
                  </div>

                  {selectedPackage === 'assessment_explanation' && (
                    <div className="space-y-4 pt-2 border-t border-black/5 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-intel-dark/40">Select Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setSessionMode('online')}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              sessionMode === 'online' 
                                ? 'border-terracotta bg-terracotta text-white shadow-md' 
                                : 'border-black/5 bg-white text-intel-dark/80 hover:border-black/20'
                            }`}
                          >
                            <Monitor size={14} /> Online
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSessionMode('inperson')}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              sessionMode === 'inperson' 
                                ? 'border-terracotta bg-terracotta text-white shadow-md' 
                                : 'border-black/5 bg-white text-intel-dark/80 hover:border-black/20'
                            }`}
                          >
                            <MapPin size={14} /> In-Person
                          </button>
                        </div>
                      </div>

                      {sessionMode === 'inperson' && (
                        <div className="p-3 bg-white border border-black/5 rounded-2xl space-y-2">
                          <div className="flex items-center gap-1.5 text-intel-dark/80 font-bold text-[9px] uppercase tracking-wider">
                            <MapPin size={12} className="text-terracotta" />
                            <span>Clinic Location: Ayappakkam, Chennai</span>
                          </div>
                          <iframe
                            src="https://maps.google.com/maps?q=144,%20Seetha%20Patabi%20Nagar,%20Maruthi%20Nagar,%20Ayappakkam,%20Chennai,%20Tamil%20Nadu%20600077&t=&z=14&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="180"
                            style={{ border: 0, borderRadius: '8px' }}
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Clinic Location Map"
                          ></iframe>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-intel-dark/40">Select Date</label>
                          <input 
                            type="date" 
                            min={today}
                            value={date}
                            onChange={e => {
                              setDate(e.target.value);
                              setTime('');
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-xs font-medium text-intel-dark outline-none focus:border-terracotta transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-intel-dark/40">Select Slot</label>
                          <select 
                            disabled={!date}
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-xs font-medium text-intel-dark outline-none focus:border-terracotta disabled:opacity-50 transition-colors"
                          >
                            <option value="">Choose slot</option>
                            {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-intel-dark/40">Total Amount:</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-intel-dark">
                        ₹{selectedPackage === 'assessment_only' ? assessmentPrice : plusPrice}
                      </span>
                      {demoMode && (
                        <span className="ml-2 align-middle bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-amber-200">
                          Demo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </>)}
              </div>

              {showPackages && (
              <div className="space-y-4">
                {error && (
                  <div className="text-red-600 text-xs bg-red-50 border border-red-100 p-3 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || (selectedPackage === 'assessment_explanation' && (!sessionMode || !date || !time))}
                  className="w-full bg-terracotta text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${selectedPackage === 'assessment_only' ? assessmentPrice : plusPrice} & Begin`
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-intel-dark/40">
                  <ShieldCheck size={14} className="text-serene-green shrink-0" />
                  Secured Checkout via Cashfree
                </div>
              </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CareerPaymentGate;
