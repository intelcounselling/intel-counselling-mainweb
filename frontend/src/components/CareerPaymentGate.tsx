import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Sparkles, Brain, Target, UserCheck, PhoneCall, Check, Monitor, MapPin, RotateCcw, BadgeCheck } from 'lucide-react';
import { AssessmentPage } from './AssessmentUI';
import { apiClient } from '../utils/api';
import { usePricing, formatPrice } from '../utils/pricing';
import { payWithRazorpay, PaymentCancelledError } from '../utils/payments';

interface CareerPaymentGateProps {
  // The signed-in account (the page guarantees one) — used for checkout details
  customer: { id: string; name: string; email: string; phone?: string | null };
  onSuccess: () => void;
  onClose: () => void;
}

const CareerPaymentGate: React.FC<CareerPaymentGateProps> = ({ customer, onSuccess, onClose }) => {
  const { demoMode, prices } = usePricing();
  const assessmentPrice = formatPrice(prices.career_assessment);
  const plusPrice = formatPrice(prices.career_assessment_plus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'assessment_only' | 'assessment_explanation'>('assessment_only');
  const [sessionMode, setSessionMode] = useState<'online' | 'inperson' | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // --- Purchase entitlement for the signed-in account --------------------
  const [entitled, setEntitled] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  // null = follow the entitlement default (packages hidden once entitled)
  const [packagesOverride, setPackagesOverride] = useState<boolean | null>(null);
  const showPackages = packagesOverride ?? !entitled;

  useEffect(() => {
    let alive = true;
    apiClient.get<any>('/api/career-access')
      .then((r) => alive && setEntitled(!!r?.entitled))
      .catch(() => {})
      .finally(() => alive && setAccessLoading(false));
    return () => { alive = false; };
  }, [customer.id]);

  // Retake: entitlement is enforced server-side (career-access +
  // send-career-results); here we just skip the payment step.
  const handleRetake = () => {
    onSuccess();
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

    try {
      const serviceId = selectedPackage === 'assessment_only' ? 'career_assessment' : 'career_assessment_plus';
      const serviceName = selectedPackage === 'assessment_only'
        ? 'Career Guidance Assessment (Assessment Only)'
        : 'Career Guidance Assessment (Assessment + Result Explanation)';

      // Resolves only after the server has verified the payment with Razorpay
      const orderId = await payWithRazorpay({
        serviceId,
        serviceName,
        customer: { name: customer.name, email: customer.email, phone: customer.phone },
      });

      // Persist the verified order id so the assessment save can link the
      // result to this payment server-side (single-use).
      localStorage.setItem('career_order_id', orderId);
      if (selectedPackage === 'assessment_explanation') {
        localStorage.setItem('career_booked_session_mode', sessionMode);
        localStorage.setItem('career_booked_date', date);
        localStorage.setItem('career_booked_time', time);
      } else {
        localStorage.removeItem('career_booked_session_mode');
        localStorage.removeItem('career_booked_date');
        localStorage.removeItem('career_booked_time');
      }
      onSuccess();
    } catch (err: any) {
      if (!(err instanceof PaymentCancelledError)) setError(err?.message || 'The payment could not be completed.');
    } finally {
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
    <AssessmentPage align="center">
      <div className="relative bg-white w-full max-w-4xl rounded-[36px] shadow-[0_20px_50px_rgba(26,26,26,0.15)] border border-black/5 overflow-hidden flex flex-col lg:flex-row as-pop">
        
        {/* Left: Value Proposition */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 bg-intel-dark text-white relative">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[100px] opacity-40"></div>
          
          <button 
            onClick={onClose} 
            className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors mb-10"
          >
            &larr; Back
          </button>

          <span className="text-terracotta font-black text-xs uppercase tracking-[0.1em] mb-4 block">Premium Suite</span>
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
                      <span className="bg-serene-green text-white text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Included</span>
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
            <>
              <div>
                {accessLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-intel-dark/40 text-[11px] font-semibold">
                    <Loader2 size={12} className="animate-spin" /> Checking your account...
                  </div>
                ) : (
                  <>
                    {entitled && (
                      <div className="p-5 rounded-2xl bg-serene-green/10 border border-serene-green/30 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <BadgeCheck size={14} className="text-serene-green" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-serene-green">Access Active</span>
                        </div>
                        <p className="text-xs text-intel-dark/70 font-medium leading-relaxed mb-4">
                          You already own the Career Guidance Assessment. Retake it anytime — no payment needed.
                        </p>
                        <button
                          onClick={handleRetake}
                          className="w-full bg-serene-green text-white py-4 rounded-xl font-semibold text-[11px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
                        >
                          <RotateCcw size={12} /> Retake Test — Free
                        </button>
                      </div>
                    )}

                    {entitled && !showPackages && (
                      <button
                        type="button"
                        onClick={() => setPackagesOverride(true)}
                        className="text-[11px] text-terracotta hover:underline font-bold"
                      >
                        Want the + Result Explanation add-on? Choose a package
                      </button>
                    )}
                  </>
                )}

                {showPackages && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-[11px] font-bold uppercase tracking-wider mb-8">
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
                      className={`w-full p-4 rounded-3xl border-2 text-left transition-all duration-300 ease-bounce flex flex-col gap-1.5 ${
                        selectedPackage === 'assessment_only' 
                          ? 'border-terracotta bg-peach shadow-[0_4px_0_rgba(193,155,108,0.5)] -translate-y-0.5' 
                          : 'border-black/5 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs text-intel-dark">Assessment Only</span>
                        <span className="font-black text-sm text-terracotta">₹{assessmentPrice}</span>
                      </div>
                      <p className="text-[11px] text-intel-dark/60 leading-relaxed font-medium">Interest Test + Aptitude Test + Intelligence Test + Score Report (PDF)</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setSelectedPackage('assessment_explanation')}
                      className={`w-full p-4 rounded-3xl border-2 text-left transition-all duration-300 ease-bounce flex flex-col gap-1.5 ${
                        selectedPackage === 'assessment_explanation' 
                          ? 'border-terracotta bg-peach shadow-[0_4px_0_rgba(193,155,108,0.5)] -translate-y-0.5' 
                          : 'border-black/5 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs text-intel-dark">Assessment + Result Explanation</span>
                        <span className="font-black text-sm text-terracotta">₹{plusPrice}</span>
                      </div>
                      <p className="text-[11px] text-intel-dark/60 leading-relaxed font-medium">Three tests + Detailed Report + 30–45 min interpretation session</p>
                    </button>
                  </div>

                  {selectedPackage === 'assessment_explanation' && (
                    <div className="space-y-4 pt-2 border-t border-black/5 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-intel-dark/40">Select Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setSessionMode('online')}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              sessionMode === 'online' 
                                ? 'border-terracotta bg-terracotta text-intel-dark shadow-md' 
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
                                ? 'border-terracotta bg-terracotta text-intel-dark shadow-md' 
                                : 'border-black/5 bg-white text-intel-dark/80 hover:border-black/20'
                            }`}
                          >
                            <MapPin size={14} /> In-Person
                          </button>
                        </div>
                      </div>

                      {sessionMode === 'inperson' && (
                        <div className="p-3 bg-white border border-black/5 rounded-2xl space-y-2">
                          <div className="flex items-center gap-1.5 text-intel-dark/80 font-bold text-[11px] uppercase tracking-wider">
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
                          <label className="text-sm font-semibold text-intel-dark/40">Select Date</label>
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
                          <label className="text-sm font-semibold text-intel-dark/40">Select Slot</label>
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
                        <span className="ml-2 align-middle bg-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-amber-200">
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
                  <div role="alert" className="text-red-800 text-xs bg-[#F9D9D4] p-3 rounded-2xl font-medium">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || (selectedPackage === 'assessment_explanation' && (!sessionMode || !date || !time))}
                  className="w-full bg-terracotta text-intel-dark h-14 rounded-full font-semibold text-base shadow-[0_8px_24px_rgba(26,26,26,0.18)] hover:bg-[#cfac80] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-intel-dark/40">
                  <ShieldCheck size={14} className="text-serene-green shrink-0" />
                  Secure checkout via Razorpay
                </div>
              </div>
              )}
            </>
        </div>

      </div>
    </AssessmentPage>
  );
};

export default CareerPaymentGate;
