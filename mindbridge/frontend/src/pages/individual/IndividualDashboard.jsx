import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound, ClipboardCheck, Brain, MessagesSquare, Lock, Check, CheckCircle2, Clock, ArrowRight,
  RotateCcw, PartyPopper, ShieldCheck, CalendarPlus, CalendarDays, Video, FileBarChart2, Sparkles, Layers,
} from 'lucide-react';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { formatDate, formatDateTime, getIntellTone } from '../../utils/formatters';
import { testMeta, TestIcon } from '../../utils/testMeta';

function loadCashfree() {
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// ── Small pieces ──────────────────────────────────────────────

function ProgressRing({ done, total }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="relative w-20 h-20 flex-shrink-0" role="img" aria-label={`${done} of ${total} assessments done`}>
      <svg viewBox="0 0 72 72" className="w-20 h-20 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="#C19B6C" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-xl font-bold leading-none">{done}</span>
        <span className="text-[10px] text-white/60">of {total}</span>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: KeyRound, title: 'Unlock', text: 'One payment, both modules' },
  { icon: ClipboardCheck, title: 'Take the tests', text: '7 short assessments' },
  { icon: Brain, title: 'See your profile', text: 'Strengths & focus areas' },
  { icon: MessagesSquare, title: 'Talk it through', text: 'With a counsellor' },
];

function Journey({ step }) {
  return (
    <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STEPS.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'now' : 'next';
        return (
          <li key={s.title} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
            state === 'now' ? 'bg-white border-accent-300 shadow-card ring-2 ring-accent-200' : state === 'done' ? 'bg-primary-50 border-primary-100' : 'bg-white/60 border-surface-200'}`}>
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              state === 'done' ? 'bg-primary-700 text-white' : state === 'now' ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-400'}`}>
              {state === 'done' ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${state === 'next' ? 'text-surface-500' : 'text-surface-900'}`}>
                <span className="text-surface-400 font-medium mr-1">{i + 1}.</span>{s.title}
              </p>
              <p className="text-xs text-surface-500 leading-snug">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TestCard({ test, unlocked }) {
  const m = testMeta(test.category);
  const body = (
    <div className={`group h-full rounded-2xl border bg-white p-5 flex flex-col transition-all ${
      unlocked ? 'border-surface-200 hover:-translate-y-1 hover:shadow-card-hover hover:border-accent-300' : 'border-surface-200 opacity-80'}`}>
      <div className="flex items-start justify-between gap-3">
        <TestIcon category={test.category} />
        {test.done ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        ) : !unlocked ? (
          <Lock className="w-4 h-4 text-surface-400" aria-label="Locked" />
        ) : null}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-surface-500">{m.label}</p>
      <h3 className="font-semibold text-surface-900 leading-snug mt-0.5">{test.name}</h3>
      <p className="text-sm text-surface-500 mt-1.5 flex-1">{m.blurb}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-surface-500">
          <Clock className="w-3.5 h-3.5" /> ~{test.estimatedMinutes} min
          {test.done && <span className="hidden sm:inline">· {formatDate(test.lastTakenAt)}</span>}
        </span>
        {unlocked && (
          <span className={`inline-flex items-center gap-1 font-semibold ${test.done ? 'text-surface-600' : 'text-primary-700'} group-hover:gap-1.5 transition-all`}>
            {test.done ? <><RotateCcw className="w-3.5 h-3.5" /> Retake</> : <>Start <ArrowRight className="w-3.5 h-3.5" /></>}
          </span>
        )}
      </div>
    </div>
  );
  return unlocked
    ? <Link to={`/individual/tests/${test.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl">{body}</Link>
    : body;
}

function UnlockCard({ price, paying, onBuy }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent-200 bg-gradient-to-br from-accent-50 via-white to-primary-50 p-6 sm:p-8">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent-100/70" aria-hidden="true" />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-800 bg-accent-100 rounded-full px-3 py-1">
            <Sparkles className="w-3.5 h-3.5" /> One price · everything included
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-surface-900 mt-3">Unlock both modules</h2>
          <p className="text-surface-600 mt-1.5 max-w-xl">
            Module A (5 Intell assessments) and Module B (the full 7-test battery with your integrated profile), with a single payment and no extra charges.
          </p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-surface-700">
            {['All 7 assessments, retake anytime', 'Integrated psychological profile', 'Downloadable PDF report', 'Request sessions with a counsellor'].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="text-center md:text-right">
          <p className="text-4xl font-bold text-surface-900">₹{price.toLocaleString('en-IN')}</p>
          <p className="text-xs text-surface-500 mb-4">one-time</p>
          <Button size="lg" className="w-full md:w-auto" loading={paying} onClick={onBuy} icon={<KeyRound className="w-4 h-4" />}>Unlock now</Button>
          <p className="mt-3 text-[11px] text-surface-400 flex items-center justify-center md:justify-end gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure payment via Cashfree</p>
        </div>
      </div>
    </div>
  );
}

function ModuleSection({ tag, title, text, tests, unlocked, extra }) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">{tag}</span>
          <h2 className="font-serif text-xl text-surface-900">{title}</h2>
          <p className="text-sm text-surface-500">{text}</p>
        </div>
        <span className="text-xs font-medium text-surface-500">{tests.filter((t) => t.done).length}/{tests.length} done</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((t) => <TestCard key={t.id} test={t} unlocked={unlocked} />)}
        {extra}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function IndividualDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { success, error: toastError, info } = useToast();
  const [paying, setPaying] = useState(false);
  const [params, setParams] = useSearchParams();
  const handledReturn = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['individual-dashboard'],
    queryFn: () => api.get('/individual/dashboard').then((r) => r.data),
  });

  const confirm = async (orderId) => {
    const { data: v } = await api.post('/individual/verify-payment', { orderId });
    if (v.paid) {
      success('Payment received — everything is unlocked. Have fun!');
      qc.invalidateQueries({ queryKey: ['individual-dashboard'] });
    } else {
      info('We have not received the payment yet. If you were charged, access unlocks automatically — refresh in a minute.');
    }
  };

  // Back from a redirect-style checkout: ?order_id=...
  useEffect(() => {
    const orderId = params.get('order_id');
    if (!orderId || handledReturn.current) return;
    handledReturn.current = true;
    confirm(orderId).catch((e) => toastError(e.response?.data?.error || 'Could not confirm the payment.')).finally(() => setParams({}, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = async () => {
    setPaying(true);
    try {
      if (!(await loadCashfree())) throw new Error('Could not load the payment window. Check your connection and try again.');
      const { data: order } = await api.post('/individual/checkout');
      const cashfree = await window.Cashfree({ mode: order.mode });
      const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
      if (result?.error) {
        toastError(result.error.message || 'The payment was not completed.');
        return;
      }
      await confirm(order.orderId);
    } catch (e) {
      toastError(e.response?.data?.error || e.message || 'Something went wrong with the payment.');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { access = {}, modules = [], recentResults = [], upcomingAppointments = [] } = data || {};
  const unlocked = !!access.unlocked;
  const moduleA = modules.find((m) => m.key === 'A');
  const moduleB = modules.find((m) => m.key === 'B');
  const allTests = moduleB?.tests || [];
  const aCategories = new Set((moduleA?.tests || []).map((t) => t.category));
  const clinical = allTests.filter((t) => !aCategories.has(t.category));
  const done = allTests.filter((t) => t.done).length;
  const allDone = allTests.length > 0 && done === allTests.length;
  const nextTest = allTests.find((t) => !t.done);
  const step = !unlocked ? 0 : !allDone ? 1 : upcomingAppointments.length ? 3 : 2;

  return (
    <div className="space-y-8 max-w-6xl animate-slide-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-accent-600/20 blur-2xl" aria-hidden="true" />
        <div className="absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-primary-400/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-accent-300 text-sm font-medium inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Your space</p>
            <h1 className="font-serif text-3xl sm:text-4xl mt-1">Hi {user?.firstName}!</h1>
            <p className="text-white/75 mt-2">
              {!unlocked && 'Get to know yourself better: how you learn, how you feel and what helps you grow.'}
              {unlocked && !allDone && (done ? `Nice going, you've finished ${done} of ${allTests.length}. Keep it up!` : "You're all set. Pick any assessment to begin, there are no right or wrong answers.")}
              {unlocked && allDone && "You've completed every assessment. Your full profile is ready to explore."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {!unlocked && (
                <Button size="lg" loading={paying} onClick={buy} className="!bg-accent-600 hover:!bg-accent-700 !text-white" icon={<KeyRound className="w-4 h-4" />}>
                  Unlock for ₹{(access.price || 0).toLocaleString('en-IN')}
                </Button>
              )}
              {unlocked && nextTest && (
                <Link to={`/individual/tests/${nextTest.id}`}>
                  <Button size="lg" className="!bg-accent-600 hover:!bg-accent-700 !text-white" icon={<ArrowRight className="w-4 h-4" />}>
                    {done ? 'Continue' : 'Start'}: {testMeta(nextTest.category).label}
                  </Button>
                </Link>
              )}
              {unlocked && done > 0 && (
                <Link to="/individual/profile">
                  <Button size="lg" variant="outline" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" icon={<FileBarChart2 className="w-4 h-4" />}>My profile</Button>
                </Link>
              )}
            </div>
          </div>
          {unlocked && <ProgressRing done={done} total={allTests.length} />}
        </div>
      </div>

      <Journey step={step} />

      {!unlocked && <UnlockCard price={access.price || 0} paying={paying} onBuy={buy} />}

      {allDone && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 p-5">
          <span className="w-12 h-12 rounded-2xl bg-accent-600 text-white flex items-center justify-center"><PartyPopper className="w-6 h-6" /></span>
          <div className="flex-1 min-w-[12rem]">
            <p className="font-semibold text-surface-900">All 7 done, amazing work!</p>
            <p className="text-sm text-surface-600">Your integrated profile is ready. A counsellor can walk you through it.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/individual/profile"><Button icon={<Brain className="w-4 h-4" />}>View profile</Button></Link>
            <Link to="/individual/sessions"><Button variant="outline" icon={<CalendarPlus className="w-4 h-4" />}>Book a session</Button></Link>
          </div>
        </div>
      )}

      {moduleA && (
        <ModuleSection tag={moduleA.tagline} title={moduleA.name} text={moduleA.description} tests={moduleA.tests} unlocked={unlocked} />
      )}

      {moduleB && (
        <ModuleSection
          tag={moduleB.tagline}
          title={moduleB.name}
          text="Adds two standard screenings to the five above. Together all 7 build your integrated psychological profile."
          tests={clinical}
          unlocked={unlocked}
          extra={(
            <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-5 flex flex-col">
              <span className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center"><Layers className="w-5 h-5" /></span>
              <h3 className="font-semibold text-surface-900 mt-4">Integrated profile</h3>
              <p className="text-sm text-surface-600 mt-1.5 flex-1">Strengths, focus areas and counselling recommendations, combining all 7 results.</p>
              {unlocked && done > 0 && (
                <Link to="/individual/profile" className="mt-4 text-xs font-semibold text-primary-700 inline-flex items-center gap-1">Open profile <ArrowRight className="w-3.5 h-3.5" /></Link>
              )}
            </div>
          )}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 inline-flex items-center gap-2"><FileBarChart2 className="w-4 h-4 text-primary-600" /> Recent results</h3>
            <Link to="/individual/results" className="text-sm font-medium text-primary-700">View all</Link>
          </div>
          {!recentResults.length ? (
            <EmptyState icon={<ClipboardCheck className="w-6 h-6 text-surface-500" />} title="No results yet" description="Finish an assessment and your results show up here." />
          ) : (
            <div className="divide-y divide-surface-100">
              {recentResults.map((r) => (
                <Link key={r.id} to={`/individual/results/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50">
                  <TestIcon category={r.test.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{r.test.name}</p>
                    <p className="text-xs text-surface-400">{formatDate(r.takenAt)}</p>
                  </div>
                  <SeverityBadge severity={r.severity} size="xs" tone={getIntellTone(r)} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 inline-flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary-600" /> Upcoming sessions</h3>
            <Link to="/individual/sessions" className="text-sm font-medium text-primary-700">All sessions</Link>
          </div>
          {!upcomingAppointments.length ? (
            <EmptyState
              icon={<MessagesSquare className="w-6 h-6 text-surface-500" />}
              title="No sessions booked"
              description={unlocked ? 'Want to talk through your results? Request a session and a counsellor will confirm a time.' : 'Unlock the assessments to request a counselling session.'}
              action={unlocked && <Link to="/individual/sessions"><Button size="sm" icon={<CalendarPlus className="w-4 h-4" />}>Request a session</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-surface-100">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0"><CalendarDays className="w-4 h-4" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900">{formatDateTime(a.slot)}</p>
                    <p className="text-xs text-surface-400">{a.status === 'PENDING' ? 'Awaiting confirmation' : `with ${a.psychiatrist?.firstName} ${a.psychiatrist?.lastName}`}</p>
                  </div>
                  {a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700"><Video className="w-4 h-4" /> Join</a>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
