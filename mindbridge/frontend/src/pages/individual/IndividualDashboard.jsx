import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, CheckCircle2, Clock, Lock, ArrowRight, FileText, Video } from 'lucide-react';
import { Card, Button, Spinner, PageHeader, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { formatDate, formatDateTime, getIntellTone } from '../../utils/formatters';

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

function ModuleCard({ mod, paying, onBuy }) {
  const pct = mod.tests.length ? Math.round((mod.completed / mod.tests.length) * 100) : 0;
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-700 bg-accent-50 border border-accent-100 rounded-md px-2 py-0.5">{mod.tagline}</span>
          <h2 className="text-lg font-semibold text-surface-900 mt-2 leading-snug">{mod.name}</h2>
        </div>
        {mod.owned
          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5" /> Unlocked</span>
          : <span className="inline-flex items-center gap-1 text-xs font-medium text-surface-500 bg-surface-100 rounded-full px-2.5 py-1 whitespace-nowrap"><Lock className="w-3.5 h-3.5" /> Locked</span>}
      </div>

      <p className="text-sm text-surface-500 mt-2">{mod.description}</p>

      <ul className="mt-4 space-y-1.5 text-sm text-surface-700">
        {mod.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-primary-600 flex-shrink-0" />{d}</li>
        ))}
      </ul>

      {mod.owned ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
            <span>{mod.completed} of {mod.tests.length} assessments completed</span><span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-100 overflow-hidden"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} /></div>
          <div className="mt-4 divide-y divide-surface-100 border border-surface-100 rounded-xl">
            {mod.tests.map((t) => (
              <Link key={t.id} to={`/individual/tests/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{t.name}</p>
                  <p className="text-xs text-surface-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> ~{t.estimatedMinutes} min{t.done && <> · last taken {formatDate(t.lastTakenAt)}</>}
                  </p>
                </div>
                <span className={`text-xs font-semibold flex items-center gap-1 ${t.done ? 'text-surface-500' : 'text-primary-700'}`}>
                  {t.done ? 'Retake' : 'Start'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
          {mod.completed > 0 && (
            <Link to="/individual/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
              <FileText className="w-4 h-4" /> View your {mod.key === 'B' ? 'integrated profile' : 'results summary'}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 pt-5 border-t border-surface-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-surface-900">₹{mod.price.toLocaleString('en-IN')}</p>
            <p className="text-xs text-surface-400">One-time · retake as often as you like</p>
          </div>
          <Button size="lg" loading={paying === mod.key} disabled={!!paying} onClick={() => onBuy(mod.key)}>Get access</Button>
        </div>
      )}
    </Card>
  );
}

export default function IndividualDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { success, error: toastError, info } = useToast();
  const [paying, setPaying] = useState(null);
  const [params, setParams] = useSearchParams();
  const handledReturn = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['individual-dashboard'],
    queryFn: () => api.get('/individual/dashboard').then((r) => r.data),
  });

  const confirm = async (orderId) => {
    const { data: v } = await api.post('/individual/verify-payment', { orderId });
    if (v.paid) {
      success('Payment received — your assessments are unlocked.');
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

  const buy = async (key) => {
    setPaying(key);
    try {
      if (!(await loadCashfree())) throw new Error('Could not load the payment window. Check your connection and try again.');
      const { data: order } = await api.post('/individual/checkout', { module: key });
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
      setPaying(null);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { modules = [], recentResults = [], upcomingAppointments = [] } = data || {};
  const anyOwned = modules.some((m) => m.owned);

  return (
    <div className="space-y-6 max-w-6xl animate-slide-up">
      <PageHeader
        title={`Welcome, ${user?.firstName}`}
        description={anyOwned ? 'Pick up where you left off, or talk to a counsellor about your results.' : 'Choose a module to get started. You can take the assessments right after payment.'}
        actions={anyOwned && <Link to="/individual/sessions"><Button icon={<CalendarPlus className="w-4 h-4" />}>Request a session</Button></Link>}
      />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {modules.map((m) => <ModuleCard key={m.key} mod={m} paying={paying} onBuy={buy} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900">Recent results</h3>
            <Link to="/individual/results" className="text-sm font-medium text-primary-700">View all</Link>
          </div>
          {!recentResults.length ? <EmptyState icon="📋" title="No results yet" description="Complete an assessment to see your results here." /> : (
            <div className="divide-y divide-surface-50">
              {recentResults.map((r) => (
                <Link key={r.id} to={`/individual/results/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50">
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
            <h3 className="font-semibold text-surface-900">Upcoming sessions</h3>
            <Link to="/individual/sessions" className="text-sm font-medium text-primary-700">All sessions</Link>
          </div>
          {!upcomingAppointments.length ? (
            <EmptyState icon="📅" title="No upcoming sessions" description={anyOwned ? 'Request a session and a counsellor will confirm a time.' : 'Unlock a module to request a counselling session.'} />
          ) : (
            <div className="divide-y divide-surface-50">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
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
