import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Lock, Clock, RotateCcw, Download, CalendarPlus, Brain,
  ShieldCheck, Star, ShieldAlert, Target, PartyPopper, Loader2, KeyRound, Info,
} from 'lucide-react';
import FadeIn from '../components/FadeIn';
import SpotlightCard from '../components/SpotlightCard';
import { apiClient } from '../utils/api';
import { authHeaders, useAuthUser } from '../utils/auth';
import { usePricing, formatPrice } from '../utils/pricing';
import { payWithRazorpay, PaymentCancelledError } from '../utils/payments';
import { INTELL_META, INTELL_ORDER, IntellIcon, LEVEL_STYLE, capitalise, intellTestPath } from '../utils/intellMeta';

const REC_STYLE: Record<string, string> = {
  none: 'bg-green-50 border-green-200 text-green-900',
  monitor: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  counselling: 'bg-orange-50 border-orange-200 text-orange-900',
  referral: 'bg-red-50 border-red-200 text-red-900',
};

// Intel Student Assessments: landing page for visitors, the client's hub after purchase.
const IntellAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { prices, demoMode } = usePricing();
  const priceA = prices.intell_assessment ?? 250;   // Module A: the five Intel tests
  const priceB = prices.intell_module_b ?? 300;     // Module B: all seven + integrated profile

  const [defs, setDefs] = useState<any[]>([]);
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
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

  const buy = async (serviceId: 'intell_assessment' | 'intell_module_b') => {
    if (!user) return navigate('/login?next=/intell-assessment');
    setPaying(serviceId);
    setError(null);
    try {
      // Resolves only after the server has verified the payment with Razorpay
      await payWithRazorpay({
        serviceId,
        serviceName: serviceId === 'intell_module_b' ? 'Intel Student Assessments: Module B (full battery)' : 'Intel Student Assessments: Module A',
        customer: { name: user.name, email: user.email, phone: (user as any).phone },
      });
      await loadStatus();
    } catch (e: any) {
      if (!(e instanceof PaymentCancelledError)) setError(e?.data?.error || e?.message || 'Something went wrong with the payment.');
    } finally {
      setPaying(null);
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

  const entitled = !!status?.entitled;   // Module A (or B, which includes it)
  const moduleB = !!status?.moduleB;
  const upgrade = status?.prices?.upgrade ?? Math.max(1, priceB - priceA);
  const owns = (id: string) => (INTELL_META[id].module === 'A' ? entitled : moduleB);
  const total = moduleB ? 7 : 5;
  const tests = INTELL_ORDER.map((id) => ({
    id,
    def: defs.find((d) => d.id === id),
    st: status?.tests?.find((t: any) => t.id === id),
  }));
  const done = tests.filter((t) => owns(t.id) && t.st?.done).length;
  const nextTest = tests.find((t) => owns(t.id) && !t.st?.done);
  const profile = status?.profile;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7EBD3] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-terracotta" />
      </div>
    );
  }

  // Locked cards are plain descriptions (what you get); bought cards are buttons.
  // The lock is stated once per section header instead of on every card.
  const testCard = (t: (typeof tests)[number]) => {
    const m = INTELL_META[t.id];
    const isDone = !!t.st?.done;
    const formalName = t.def?.name && !m.label.includes(t.def.name) ? t.def.name : null;
    const body = (
      <>
        <div className="flex items-start justify-between gap-3">
          <IntellIcon id={t.id} />
          {isDone && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-serene-green bg-serene-green/10 rounded-full px-2.5 py-1"><CheckCircle2 size={13} /> Done</span>
          )}
        </div>
        <h3 className="font-black serif text-intel-dark text-xl leading-snug mt-5">{m.label}</h3>
        {formalName && <p className="text-xs text-intel-dark/45 mt-1">{formalName}</p>}
        <p className="text-sm text-intel-dark/65 font-light leading-relaxed mt-3 flex-1">{m.blurb}</p>
        <div className="mt-5 pt-4 border-t border-black/5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-intel-dark/50"><Clock size={13} /> About {t.def?.estimatedMinutes || 5} min</span>
          {owns(t.id) && (
            <span className="inline-flex items-center gap-1 font-bold text-intel-dark group-hover:text-serene-green transition-colors">
              {isDone ? <><RotateCcw size={12} /> Retake</> : <>Start <ArrowRight size={12} /></>}
            </span>
          )}
        </div>
      </>
    );
    const base = 'text-left bg-white rounded-[28px] p-6 border border-black/5 flex flex-col h-full';
    return owns(t.id) ? (
      <button
        key={t.id}
        onClick={() => navigate(intellTestPath(t.id))}
        className={`group ${base} transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-lg hover:border-serene-green/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-green`}
      >
        {body}
      </button>
    ) : (
      <article key={t.id} className={base}>{body}</article>
    );
  };

  const lockNote = (text: string) => (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-intel-dark/50 whitespace-nowrap">
      <Lock size={13} /> {text}
    </span>
  );

  return (
    <div className="relative min-h-screen pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 bg-[#F7EBD3]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-serene-green/5 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/assessments')}
          className="group inline-flex items-center gap-2 mb-10 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          All assessments
        </button>

        <FadeIn>
          <header className="max-w-2xl mb-10 md:mb-12">
            <p className="text-sm font-semibold text-[#8a6a3f] mb-3">Intel Student Success Assessment™</p>
            <h1 className="serif text-4xl md:text-5xl leading-tight text-intel-dark">
              {entitled ? <>Welcome back, {user?.name?.split(' ')[0]}</> : <>Know yourself. Grow with confidence.</>}
            </h1>
            <p className="mt-4 text-base md:text-lg text-intel-dark/70 leading-relaxed">
              {entitled
                ? (done === total ? "You've completed every assessment — your profile is below." : `You've finished ${done} of ${total}. Pick up wherever you like — there are no right or wrong answers.`)
                : 'How you learn, how you study, how you feel, your screen habits and your personality — plus two standard wellbeing screenings, brought together in one profile.'}
            </p>
          </header>
        </FadeIn>

        {error && (
          <div role="alert" className="mb-8 bg-red-50 text-red-700 border border-red-100 rounded-2xl px-5 py-4 text-sm font-medium text-center">{error}</div>
        )}

        {/* ── Purchase card (not yet bought) ── */}
        {!entitled && (
          <FadeIn delay={150}>
            <SpotlightCard className="bg-[#1C1F22] border-2 border-terracotta/20 p-8 md:p-14 rounded-[28px] md:rounded-[32px] shadow-2xl mb-14 text-left">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {[
                  { tag: 'Module A', title: 'Intel Student Development Assessments', text: 'Five Intel-developed assessments with colour-banded interpretation and your learning style.', ids: INTELL_ORDER.filter((id) => INTELL_META[id].module === 'A') },
                  { tag: 'Module B', title: 'Intel Student Psychological Assessment Battery™', text: 'All five plus PHQ-9 and GAD-7, combined into an integrated profile with risk identification and counselling recommendations.', ids: INTELL_ORDER.filter((id) => INTELL_META[id].module === 'B') },
                ].map((m) => (
                  <div key={m.tag} className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-terracotta">{m.tag}</span>
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
                {['Module B includes everything in A', 'Retake anytime', 'Downloadable PDF report', 'Shared with your counsellor when you book'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-serene-green/20 border border-serene-green/40 rounded-full px-3.5 py-1.5 text-xs font-bold text-white"><CheckCircle2 size={13} /> {t}</span>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-8 border-t border-white/10">
                {[
                  { id: 'intell_assessment' as const, tag: 'Module A', price: priceA, note: 'The five Intel tests', highlight: false },
                  { id: 'intell_module_b' as const, tag: 'Module B', price: priceB, note: 'All seven tests + integrated profile', highlight: true },
                ].map((o) => (
                  <div key={o.id} className={`rounded-[24px] p-5 flex flex-col gap-4 ${o.highlight ? 'bg-white/10 border-2 border-terracotta/60' : 'bg-white/5 border border-white/10'}`}>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-terracotta">{o.tag}{o.highlight && ' · best value'}</span>
                      <p className="text-4xl font-black text-white serif mt-1">₹{formatPrice(o.price)}</p>
                      <p className="text-xs text-white/50 mt-1">{o.note} · one-time</p>
                    </div>
                    <button
                      onClick={() => buy(o.id)}
                      disabled={!!paying}
                      className={`w-full px-6 py-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 ${o.highlight ? 'bg-terracotta text-intel-dark hover:bg-terracotta/90 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {paying === o.id ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                      {user ? `Unlock ${o.tag}` : 'Sign in to get access'}
                    </button>
                  </div>
                ))}
              </div>
              {demoMode && <p className="mt-4 text-center"><span className="bg-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Demo Mode</span></p>}
              <p className="mt-6 text-center text-[11px] text-white/40 flex items-center justify-center gap-1.5"><ShieldCheck size={13} /> Secure payment via Razorpay · your answers stay private to your account</p>
            </SpotlightCard>
          </FadeIn>
        )}

        {/* ── Progress + next step (bought) ── */}
        {entitled && (
          <FadeIn>
            <div className="bg-intel-dark text-white rounded-[28px] p-6 md:p-10 mb-12 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-terracotta/20 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-terracotta text-[11px] font-black uppercase tracking-[0.14em] mb-2">Your progress</p>
                  <p className="text-3xl font-black serif mb-4">{done} of {total} assessments done</p>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full transition-all duration-700" style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {nextTest ? (
                    <button onClick={() => navigate(intellTestPath(nextTest.id))} className="px-7 py-4 bg-terracotta text-intel-dark rounded-2xl font-semibold text-[11px] shadow-xl transition-all flex items-center justify-center gap-2">
                      {done ? 'Continue' : 'Start'}: {INTELL_META[nextTest.id].label} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 rounded-2xl font-semibold text-[11px]"><PartyPopper size={16} className="text-terracotta" /> All done!</span>
                  )}
                  {done > 0 && (
                    <button onClick={downloadReport} disabled={downloading} className="px-7 py-4 bg-white/10 border border-white/20 rounded-2xl font-semibold text-[11px] hover:bg-white/20 transition-all flex items-center justify-center gap-2">
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 mb-6 border-b border-black/5 pb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-terracotta">Module A</span>
              <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">Student Development Assessments</h2>
            </div>
            {entitled
              ? <span className="text-xs font-bold text-intel-dark/50">{tests.filter((t) => INTELL_META[t.id].module === 'A' && t.st?.done).length} of 5 done</span>
              : lockNote(`Module A · ₹${formatPrice(priceA)}`)}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.filter((t) => INTELL_META[t.id].module === 'A').map(testCard)}
          </div>
        </section>

        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 mb-6 border-b border-black/5 pb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-terracotta">Module B</span>
              <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">Psychological Assessment Battery™</h2>
              <p className="text-sm text-intel-dark/55 font-light mt-1">The five above plus two standard screenings, brought together in one profile.</p>
            </div>
            {moduleB ? <span className="text-xs font-bold text-intel-dark/50">{done} of 7 done</span>
              : entitled ? (
                <button onClick={() => buy('intell_module_b')} disabled={!!paying} className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta text-intel-dark rounded-xl font-semibold text-xs shadow-lg hover:bg-terracotta/90 disabled:opacity-60 whitespace-nowrap">
                  {paying === 'intell_module_b' ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Add Module B for ₹{formatPrice(upgrade)}
                </button>
              ) : lockNote(`Module B · ₹${formatPrice(priceB)}, includes A`)}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.filter((t) => INTELL_META[t.id].module === 'B').map(testCard)}

            {/* The profile is the sum of all seven — show them, lit as each is done */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-[28px] p-6 bg-serene-green text-white flex flex-col">
              <h3 className="font-black serif text-xl leading-snug">{moduleB ? 'Your integrated profile' : 'Integrated profile'}</h3>
              <p className="text-sm text-white/70 font-light leading-relaxed mt-3 flex-1">
                Your strengths, any risks, areas for support and what we recommend next, built from all seven results.
              </p>
              <div
                className="mt-5 flex flex-wrap gap-1.5"
                role="img"
                aria-label={moduleB ? `${done} of 7 assessments done` : 'Built from all seven assessments'}
              >
                {tests.map((t) => {
                  const Icon = INTELL_META[t.id].icon;
                  const lit = owns(t.id) && t.st?.done;
                  return (
                    <span
                      key={t.id}
                      title={INTELL_META[t.id].label}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${lit ? `${INTELL_META[t.id].color} text-white` : 'bg-white/10 text-white/45'}`}
                    >
                      <Icon size={15} />
                    </span>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
                {moduleB ? (
                  <>
                    <span className="text-white/70">{done === 7 ? 'All 7 done' : `${done} of 7 done`}</span>
                    {profile && (
                      <button
                        onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center gap-1 font-bold text-white hover:text-terracotta transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                      >
                        See your profile <ArrowRight size={12} />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-white/60">{entitled ? 'Part of Module B' : "Ready once you've taken all seven"}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Integrated profile ── */}
        {entitled && profile && (
          <section id="profile" className="mb-14 scroll-mt-nav">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-intel-dark text-terracotta flex items-center justify-center"><Brain size={22} /></span>
              <div>
                <h2 className="text-2xl md:text-3xl font-black serif text-intel-dark">{moduleB ? 'Your integrated profile' : 'Your results summary'}</h2>
                <p className="text-sm text-intel-dark/50">{profile.summary}</p>
              </div>
            </div>

            {!profile.complete && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-5">
                <Info size={16} className="mt-0.5 shrink-0" /> Still to do: {profile.missingNames.join(', ')}. The profile is complete once all {profile.total} are done.
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

        {/* ── Talk it through: a real sequence, so the steps are numbered ── */}
        <section className="bg-intel-dark text-white rounded-[28px] md:rounded-[32px] p-8 md:p-12 grid md:grid-cols-[1fr_1.15fr] gap-10 md:gap-14 items-center">
          <div>
            <span className="mb-6 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><CalendarPlus size={22} className="text-terracotta" /></span>
            <h3 className="text-3xl md:text-4xl font-black serif leading-tight mb-4">Talk it through with a counsellor</h3>
            <p className="text-white/65 font-light leading-relaxed mb-8 max-w-md">
              Results make more sense with someone who can explain them. Share your report when you book, and your counsellor reads it before you meet.
            </p>
            <button
              onClick={() => navigate('/booking')}
              className="bg-terracotta text-intel-dark px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-[#cfac80] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book a session
            </button>
          </div>
          <ol className="space-y-3">
            {[
              ['Book a session', 'Choose online or in person, and a time that suits you.'],
              ['Tick "Share my Intel Student Assessment report"', "It's on the booking form once you've taken at least one assessment."],
              ['Your counsellor reads it first', 'They see each result, your profile and your answers before the session.'],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white/5 border border-white/10 p-5">
                <span className="w-8 h-8 shrink-0 rounded-full bg-terracotta text-intel-dark font-black text-sm flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                <div>
                  <p className="font-bold text-sm leading-snug">{title}</p>
                  <p className="text-white/55 text-sm font-light mt-1">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default IntellAssessmentPage;
