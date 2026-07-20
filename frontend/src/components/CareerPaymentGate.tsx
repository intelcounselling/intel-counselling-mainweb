import React, { useState } from 'react';
import { ShieldCheck, Loader2, Sparkles, Brain, Target, UserCheck, PhoneCall, Check, Monitor, MapPin } from 'lucide-react';

interface CareerPaymentGateProps {
  registration: any;
  onSuccess: () => void;
  onClose: () => void;
}

const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CareerPaymentGate: React.FC<CareerPaymentGateProps> = ({ registration, onSuccess, onClose }) => {
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const url = authMode === 'login' ? '/api/login' : '/api/register';
    const body = authMode === 'login'
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, phone: authPhone };

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

      localStorage.setItem('auth_user', JSON.stringify(data.user));
      // update registration state
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
      const amount = 1;
      const serviceName = selectedPackage === 'assessment_only'
        ? 'Career Guidance Assessment (Assessment Only - Promo)'
        : 'Career Guidance Assessment (Assessment + Explanation - Promo)';

      // Create session on server side
      const response = await fetch('/api/create-cashfree-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          serviceName: serviceName,
          customerName: registration.name,
          customerEmail: registration.email,
          customerPhone: registration.phone || '9999999999'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create payment session.";
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Initialize Cashfree
      const cashfree = await (window as any).Cashfree({
        mode: "production", // Using production mode as configured in backend
      });

      let checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          setError(result.error.message || "Payment transaction failed.");
          setIsProcessing(false);
        } else if (result.redirect) {
          console.log("Payment redirecting...");
        } else if (result.paymentDetails) {
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
          console.log("Unknown result from cashfree", result);
          setIsProcessing(false);
          if (result && Object.keys(result).length > 0) {
             onSuccess();
          }
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

              <div className="flex bg-black/5 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setAuthMode('register')} 
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-intel-dark shadow-sm' : 'text-intel-dark/60 hover:text-intel-dark'}`}
                >
                  Register
                </button>
                <button 
                  type="button" 
                  onClick={() => setAuthMode('login')} 
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
                <input 
                  required 
                  type="email" 
                  placeholder="Email Address" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                />
                <input 
                  required 
                  type="password" 
                  placeholder="Password" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)} 
                  className="w-full bg-white border border-black/5 rounded-xl px-3.5 py-3 text-xs text-intel-dark outline-none focus:border-terracotta transition-colors"
                />
                
                <button 
                  type="submit" 
                  disabled={authLoading} 
                  className="w-full bg-intel-dark text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-black/90 mt-4 flex items-center justify-center gap-1.5 shadow-md"
                >
                  {authLoading && <Loader2 size={12} className="animate-spin" />}
                  {authMode === 'register' ? 'Register & Continue' : 'Login & Continue'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-[10px] font-bold uppercase tracking-wider mb-8">
                  <Sparkles size={12} />
                  Select Package
                </div>
                
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
                        <span className="font-black text-sm text-terracotta">₹1</span>
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
                        <span className="font-black text-sm text-terracotta">₹1</span>
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
                      <span className="text-3xl font-black text-intel-dark">₹1</span>
                    </div>
                  </div>
                </div>
              </div>

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
                    "Pay ₹1 & Begin"
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-intel-dark/40">
                  <ShieldCheck size={14} className="text-serene-green shrink-0" />
                  Secured Checkout via Cashfree
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CareerPaymentGate;
