import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Lock, Clock, RotateCcw, Download, CalendarPlus, Brain, Layers,
  ShieldCheck, Star, ShieldAlert, Target, PartyPopper, Loader2, KeyRound, Info,
} from 'lucide-react';
import FadeIn from '../components/FadeIn';
import SpotlightCard from '../components/SpotlightCard';
import { apiClient } from '../utils/api';
import { authHeaders, useAuthUser } from '../utils/auth';
import { usePricing, formatPrice } from '../utils/pricing';
import { INTELL_META, INTELL_ORDER, IntellIcon, LEVEL_STYLE, capitalise, intellTestPath } from '../utils/intellMeta';

const loadCashfree = () =>
  new Promise<boolean>((resolve) => {
    if ((window as any).Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const REC_STYLE: Record<string, string> = {
  none: 'bg-green-50 border-green-200 text-green-900',
  monitor: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  counselling: 'bg-orange-50 border-orange-200 text-orange-900',
  referral: 'bg-red-50 border-red-200 text-red-900',
};

// Intell Student Assessments: landing page for visitors, the client's hub after purchase.
const IntellAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { prices, demoMode } = usePricing();
  const price = prices.intell_assessment ?? 2499;

  const [defs, setDefs] = useState<any[]>([]);
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = () =>
    user ? apiClient.get<any>('/api/intell/status').then(setStatus).catch(() => setStatus(null)) : Promise.resolve();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    Promise.all([apiClient.get<any>('/api/intell/tests').then((d) => setDefs(d.tests || [])).catch(() => {}), loadStatus()])
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const buy = async () => {
    if (!user) return navigate('/login?next=/intell-assessment');
    setPaying(true);
    setError(null);
    try {
      if (!(await loadCashfree())) throw new Error('Could not load the payment window. Please check your connection.');
      const order = await apiClient.post<any>('/api/create-cashfree-session', {
        serviceId: 'intell_assessment',
        serviceName: 'Intell Student Assessments (Module A + Module B)',
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: (user as any).phone || '9999999999',
      });
      const cashfree = await (window as any).Cashfree({ mode: 'production' });
      const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
      if (result?.error) throw new Error(result.error.message || 'The payment was not completed.');
      const verified = await apiClient.post<any>('/api/verify-payment', { orderId: order.orderId });
      if (!verified.paid) throw new Error('We have not received the payment yet. If you were charged, please contact us.');
      await loadStatus();
    } catch (e: any) {
      setError(e?.data?.error || e?.message || 'Something went wrong with the payment.');
    } finally {
      setPaying(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/intell/report', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Intel_Counselling_Intell_Assessment_Report.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError('Could not download the report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const entitled = !!status?.entitled;
  const tests = INTELL_ORDER.map((id) => ({
    id,
    def: defs.find((d) => d.id === id),
    st: status?.tests?.find((t: any) => t.id === id),
  }));
  const done = tests.filter((t) => t.st?.done).length;
  const nextTest = tests.find((t) => !t.st?.done);
  const profile = status?.profile;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7EBD3] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-terracotta" />
      </div>
    );
  }

  const testCard = (t: (typeof tests)[number]) => {
    const m = INTELL_META[t.id];
    const isDone = !!t.st?.done;
    return (
      <button
        key={t.id}
        disabled={!entitled}
        onClick={() => navigate(intellTestPath(t.id))}
        className={`group text-left bg-white rounded-[28px] p-6 border transition-all flex flex-col h-full ${entitled ? 'border-black/5 hover:-translate-y-1 hover:shadow-xl hover:border-terracotta/40' : 'border-black/5 opacity-80 cursor-default'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <IntellIcon id={t.id} />
          {isDone ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-serene-green bg-serene-green/10 border border-serene-green/30 rounded-full px-2.5 py-1"><CheckCircle2 size={12} /> Done</span>
          ) : !entitled ? <Lock size={16} className="text-intel-dark/30" /> : null}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta mt-5">{m.label}</span>
        <h3 className="font-black serif text-intel-dark text-lg leading-snug mt-1">{t.def?.name || m.label}</h3>
        <p className="text-sm text-intel-dark/60 font-light mt-2 flex-1">{m.blurb}</p>
        <div className="mt-5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 text-intel-dark/50"><Clock size={13} /> ~{t.def?.estimatedMinutes || 5} min</span>
          {entitled && (
            <span className="inline-flex items-center gap-1 font-black uppercase tracking-widest text-[10px] text-intel-dark group-hover:text-terracotta transition-colors">
              {isDone ? <><RotateCcw size={12} /> Retake</> : <>Start <ArrowRight size={12} /></>}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative min-h-screen pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 bg-[#F7EBD3]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-serene-green/5 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/assessments')}
          className="group flex items-center gap-3 text-white font-black transition-all mb-12 uppercase tracking-[0.2em] text-xs bg-serene-green hover:bg-[#2D6A4F] px-5 py-3 rounded-full shadow-sm w-fit"
        >
          <span className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center"><ArrowLeft size={14} /></span>
          All assessments
        </button>

        <FadeIn>
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-xl">
              <Sparkles size={14} className="animate-pulse" /> Intell Student Success Assessment™
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-intel-dark serif mb-6 leading-tight">
              {entitled ? <>Hi {user?.name?.split(' ')[0]}, let's keep <span className="italic text-serene-green">growing.</span></> : <>Know yourself. <br className="hidden md:block" /><span className="italic text-serene-green">Grow</span> with confidence.</>}
            </h1>
            <p className="text-intel-dark/60 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
              {entitled
                ? (done === 7 ? "You've completed every assessment — your full profile is below." : `You've finished ${done} of 7. Pick up wherever you like — there are no right or wrong answers.`)
                : 'How you learn, how you study, how you feel, your screen habits and your personality — plus two standard wellbeing screenings, brought together in one profile.'}
            </p>
          </div>
        </FadeIn>

        {error && (
          <div role="alert" className="mb-8 bg-red-50 text-red-700 border border-red-100 rounded-2xl px-5 py-4 text-sm font-medium text-center">{error}</div>
        )}

        {/* ── Purchase card (not yet bought) ── */}
        {!entitled && (
          <FadeIn delay={150}>
            <SpotlightCard className="bg-[#1C1F22] border-2 border-terracotta/20 p-8 md:p-14 rounded-[40px] md:rounded-[60px] shadow-2xl mb-14 text-left">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {[
                  { tag: 'Module A', title: 'Intell Student Development Assessments', text: 'Five Intell-developed assessments with colour-banded interpretation and your learning style.', ids: INTELL_ORDER.filter((id) => INTELL_META[id].module === 'A') },
                  { tag: 'Module B', title: 'Intell Student Psychological Assessment Battery™', text: 'All five plus PHQ-9 and GAD-7, combined into an integrated profile with risk identification and counselling recommendations.', ids: INTELL_ORDER.filter((id) => INTELL_META[id].module === 'B') },
                ].map((m) => (
                  <div key={m.tag} className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta">{m.tag}</span>
                    <h3 className="text-xl md:text-2xl font-black text-white serif mt-2 mb-3">{m.title}</h3>
                    <p className="text-white/60 text-sm font-light mb-5">{m.text}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.tag === 'Module B' && <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-bold text-white/80">Everything in A +</span>}
                      {m.ids.map((id) => {
                        const Icon = INTELL_META[id].icon;
                        return (
                          <span key={id} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-bold text-white/80">
                            <Icon size={13} className="text-terracotta" /> {INTELL_META[id].label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 mb-10">
                {['One payment — both modules', 'Retake anytime', 'Downloadable PDF report', 'Shared with your counsellor when you book'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-serene-green/20 border border-serene-green/40 rounded-full px-3.5 py-1.5 text-xs font-bold text-white"><CheckCircle2 size={13} /> {t}</span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
                <div>
                  <span className="text-xs font-bold text-white/40 block mb-1 uppercase tracking-wider">One-time · both modules</span>
                  <span className="text-4xl md:text-5xl font-black text-white serif">₹{formatPrice(price)}</span>
                  {demoMode && <span className="ml-3 align-middle bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Demo Mode</span>}
                </div>
                <button
                  onClick={buy}
                  disabled={paying}
                  className="w-full sm:w-auto px-10 py-5 bg-terracotta hover:bg-terracotta/90 disabled:opacity-60 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-3"
                >
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {user ? 'Unlock both modules' : 'Sign in to get access'}
                </button>
              </div>
              <p className="mt-6 text-center text-[11px] text-white/40 flex items-center justify-center gap-1.5"><ShieldCheck size={13} /> Secure payment via Cashfree · your answers stay private to your account</p>
            </SpotlightCard>
          </FadeIn>
        )}

        {/* ── Progress + next step (bought) ── */}
        {entitled && (
          <FadeIn>
            <div className="bg-intel-dark text-white rounded-[40px] p-6 md:p-10 mb-12 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-terracotta/20 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-terracotta text-[10px] font-black uppercase tracking-[0.3em] mb-2">Your progress</p>
                  <p className="text-3xl font-black serif mb-4">{done} of 7 assessments done</p>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full transition-all duration-700" style={{ width: `${(done / 7) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {nextTest ? (
                    <button onClick={() => navigate(intellTestPath(nextTest.id))} className="px-7 py-4 bg-terracotta text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                      {done ? 'Continue' : 'Start'}: {INTELL_META[nextTest.id].label} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[11px]"><PartyPopper size={16} className="text-terracotta" /> All done!</span>
                  )}
                  {done > 0 && (
                    <button onClick={downloadReport} disabled={downloading} className="px-7 py-4 bg-white/10 border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF report
                    </button>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── Tests ── */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-3 mb-6 border-b border-black/5 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta">Module A</span>
              <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">Student Development Assessments</h2>
            </div>
            {entitled && <span className="text-xs font-bold text-intel-dark/40">{tests.filter((t) => INTELL_META[t.id].module === 'A' && t.st?.done).length}/5</span>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.filter((t) => INTELL_META[t.id].module === 'A').map(testCard)}
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-end justify-between gap-3 mb-6 border-b border-black/5 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta">Module B</span>
              <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">Psychological Assessment Battery™</h2>
              <p className="text-sm text-intel-dark/50 font-light mt-1">Module A plus two standard screenings, combined into your integrated profile.</p>
            </div>
            {entitled && <span className="text-xs font-bold text-intel-dark/40">{done}/7</span>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.filter((t) => INTELL_META[t.id].module === 'B').map(testCard)}
            <div className="rounded-[28px] p-6 border-2 border-dashed border-serene-green/30 bg-serene-green/5 flex flex-col">
              <span className="w-12 h-12 rounded-2xl bg-serene-green text-white flex items-center justify-center shadow-lg"><Layers size={22} /></span>
              <h3 className="font-black serif text-intel-dark text-lg mt-5">Integrated profile</h3>
              <p className="text-sm text-intel-dark/60 font-light mt-2">Strengths, risks, areas for support and counselling recommendations — built from all 7 results.</p>
            </div>
          </div>
        </section>

        {/* ── Integrated profile ── */}
        {entitled && profile && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-intel-dark text-terracotta flex items-center justify-center"><Brain size={22} /></span>
              <div>
                <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">Your integrated profile</h2>
                <p className="text-sm text-intel-dark/50">{profile.summary}</p>
              </div>
            </div>

            {!profile.complete && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-5">
                <Info size={16} className="mt-0.5 shrink-0" /> Still to do: {profile.missingNames.join(', ')}. The profile is complete once all 7 are done.
              </div>
            )}

            {/* An all-clear only means something once every test is done; a concern shows straight away */}
            {(profile.complete || ['counselling', 'referral'].includes(profile.recommendation.level)) && (
            <div className={`rounded-[28px] border p-6 mb-5 ${REC_STYLE[profile.recommendation.level] || REC_STYLE.none}`}>
              <p className="font-black serif text-xl mb-2">{profile.recommendation.headline}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {profile.recommendation.actions.map((a: string) => <li key={a}>{a}</li>)}
              </ul>
              {profile.recommendation.level === 'referral' && (
                <button onClick={() => navigate('/crisis-support')} className="mt-3 text-sm font-bold underline">Crisis helplines</button>
              )}
            </div>
            )}

            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {[
                { title: 'Strengths', icon: Star, tint: 'bg-amber-100 text-amber-700', items: profile.strengths },
                { title: 'Risks & concerns', icon: ShieldAlert, tint: 'bg-red-50 text-red-600', items: profile.concerns.map((c: any) => `${c.area} — ${c.detail}`) },
                { title: 'Areas for support', icon: Target, tint: 'bg-serene-green/10 text-serene-green', items: profile.interventions },
              ].filter((s) => s.items.length).map((s) => (
                <div key={s.title} className="bg-white rounded-[28px] p-6 border border-black/5 shadow-sm">
                  <h3 className="font-black text-intel-dark flex items-center gap-2 mb-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.tint}`}><s.icon size={16} /></span>{s.title}
                  </h3>
                  <ul className="space-y-2 text-sm text-intel-dark/70">
                    {s.items.map((i: string) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-intel-dark/30" />{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-sm">
              <h3 className="font-black text-intel-dark mb-4">Test-wise interpretation</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.tests.map((t: any) => {
                  const id = tests.find((x) => x.def?.name === t.name)?.id || '';
                  return (
                    <div key={t.category} className="rounded-2xl bg-[#F6F7F9] p-4 flex gap-3">
                      <IntellIcon id={id} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-intel-dark text-sm">{t.name}</p>
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border my-1.5 ${LEVEL_STYLE[t.level] || LEVEL_STYLE.ok}`}>{capitalise(t.severity)}</span>
                        <p className="text-xs text-intel-dark/60">{t.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Talk it through ── */}
        <div className="p-8 md:p-14 bg-intel-dark rounded-[50px] md:rounded-[70px] text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-[120px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><CalendarPlus size={26} className="text-terracotta" /></span>
            <h3 className="text-2xl md:text-4xl font-black serif mb-4">Talk it through with a counsellor</h3>
            <p className="text-white/60 text-sm md:text-lg font-light max-w-xl mx-auto mb-8">
              When you book, tick "share my Intell report" and your counsellor receives your full report before the session.
            </p>
            <button onClick={() => navigate('/booking')} className="bg-terracotta text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
              Book a session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntellAssessmentPage;
