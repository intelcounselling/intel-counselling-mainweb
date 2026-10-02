import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lightbulb, Heart, Brain, MessagesSquare, User, Mail, Phone, Lock, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { ROLE_DASHBOARDS } from '../../utils/roleGuard';
import { MAIN_SITE_URL } from '../../utils/portalBase';

const PERKS = [
  { icon: Lightbulb, title: 'Discover how you learn', text: 'Visual, auditory or hands-on, find what works for you.' },
  { icon: Heart, title: 'Check in on how you feel', text: 'Stress, mood and screen-time, in plain language.' },
  { icon: Brain, title: 'Get your full profile', text: 'Strengths, focus areas and a downloadable report.' },
  { icon: MessagesSquare, title: 'Talk to a counsellor', text: 'Who already has your results in front of them.' },
];

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

export default function IndividualRegister() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', consent: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={ROLE_DASHBOARDS[user.role] || '/'} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/individual/register', { ...form, email: form.email.trim().toLowerCase() });
      setAuth(data);
      navigate('/individual', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white p-12 flex-col justify-between">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-accent-600/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-10 w-72 h-72 rounded-full bg-primary-400/15 blur-3xl" aria-hidden="true" />
        <img src="/assets/logo_full.png" alt="Intel Counselling" className="relative h-10 w-auto object-contain self-start" />
        <div className="relative">
          <p className="text-accent-300 text-sm font-medium inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> For individuals & families</p>
          <h2 className="font-serif text-4xl leading-tight mt-2">Understand yourself a little better.</h2>
          <ul className="mt-8 space-y-5">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><p.icon className="w-5 h-5 text-accent-300" /></span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-white/65">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50 inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Private by default. Only you and our counsellors can see your answers.</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="lg:hidden bg-surface-900 p-3 rounded-2xl inline-flex shadow-lg">
              <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-7 w-auto object-contain" />
            </div>
            <Link to="/login" className="ml-auto text-sm font-medium text-primary-700 hover:text-primary-800">Already registered? Sign in</Link>
          </div>

          <h1 className="font-serif text-3xl text-surface-900">Create your account</h1>
          <p className="text-surface-500 mt-1 mb-6 text-sm">Takes less than a minute. Not part of a school programme? You're in the right place.</p>

          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="reg-first" label="First name" icon={User}>
                <input id="reg-first" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} className="form-input !pl-10" />
              </Field>
              <Field id="reg-last" label="Last name" icon={User}>
                <input id="reg-last" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} className="form-input !pl-10" />
              </Field>
            </div>
            <Field id="reg-email" label="Email address" icon={Mail}>
              <input id="reg-email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} className="form-input !pl-10" placeholder="you@example.com" />
            </Field>
            <Field id="reg-phone" label="Phone (optional)" icon={Phone}>
              <input id="reg-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className="form-input !pl-10" placeholder="For payment receipts and session reminders" />
            </Field>
            <Field id="reg-password" label="Password" icon={Lock}>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                className="form-input !pl-10 !pr-10"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            <label className="flex items-start gap-3 text-sm text-surface-600 rounded-xl bg-white border border-surface-200 p-3 cursor-pointer">
              <input type="checkbox" required checked={form.consent} onChange={set('consent')} className="mt-0.5 h-4 w-4 rounded border-surface-300 accent-primary-700" />
              <span>
                I agree to the <a className="text-primary-700 underline" href={`${MAIN_SITE_URL}/terms`} target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
                <a className="text-primary-700 underline" href={`${MAIN_SITE_URL}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and I'm happy for Intel Counselling's counsellors to store and review my answers.
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" loading={loading}>Create my account</Button>
          </form>

          <p className="mt-5 lg:hidden flex items-start gap-2 text-xs text-surface-400">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" /> Private by default. Only you and our counsellors can see your answers.
          </p>
        </div>
      </div>
    </div>
  );
}
