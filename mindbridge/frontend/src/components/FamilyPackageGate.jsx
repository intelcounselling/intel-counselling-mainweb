import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, GitCompareArrows, ClipboardList, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { Button, Card, Spinner } from './ui';
import api from '../lib/axios';

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Parent + student family package: Parent Perspective and the Comparison Report
// open once the family has paid (one payment covers both parents).
export default function FamilyPackageGate({ children }) {
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['family-package'],
    queryFn: () => api.get('/parent/family-package').then((r) => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;
  if (data?.unlocked) return children;

  const buy = async () => {
    setError('');
    setPaying(true);
    try {
      if (!(await loadCheckout())) throw new Error('Could not load the payment window. Please check your connection.');
      const { data: o } = await api.post('/parent/family-package/order');
      new window.Razorpay({
        key: o.keyId,
        order_id: o.razorpayOrderId,
        amount: o.amount,
        currency: o.currency,
        name: o.name,
        description: o.description,
        prefill: o.prefill,
        theme: { color: '#1C3F39' },
        handler: async (r) => {
          try {
            const { data: v } = await api.post('/parent/family-package/verify', { orderId: o.orderId, ...r });
            if (v.paid) qc.invalidateQueries({ queryKey: ['family-package'] });
            else setError(`We have not received the payment yet. If you were charged, contact us with order ID ${o.orderId}.`);
          } catch (e) {
            setError(e.response?.data?.error || 'Could not confirm the payment.');
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      }).open();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not start the payment.');
      setPaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <Link to="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-primary-800 to-primary-900 text-white p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300"><Lock className="w-3.5 h-3.5" /> Family package</span>
          <h1 className="font-serif text-2xl sm:text-3xl mt-2">Parent + Student package</h1>
          <p className="text-white/70 text-sm mt-2">See your child's results alongside your own view of them, and where the two differ.</p>
        </div>
        <div className="p-6 sm:p-8 space-y-5">
          <ul className="space-y-3">
            {[
              { icon: ClipboardList, title: 'Parent Perspective', text: 'Answer the same assessments from your point of view.' },
              { icon: GitCompareArrows, title: 'Comparison Report', text: "Your answers next to your child's, domain by domain." },
              { icon: Users, title: 'For the whole family', text: 'One payment unlocks it for both parents.' },
            ].map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0"><f.icon className="w-5 h-5" /></span>
                <div>
                  <p className="font-semibold text-surface-900">{f.title}</p>
                  <p className="text-sm text-surface-500">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-surface-100">
            <div>
              <p className="text-3xl font-bold text-surface-900">₹{Number(data?.price || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-surface-400">one-time, per family</p>
            </div>
            <Button size="lg" loading={paying} onClick={buy}>Unlock family package</Button>
          </div>
          <p className="text-xs text-surface-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Secure payment via Razorpay</p>
        </div>
      </Card>
    </div>
  );
}
