import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { ROLE_DASHBOARDS } from '../../utils/roleGuard';
import { MAIN_SITE_URL } from '../../utils/portalBase';

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
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="bg-surface-900 p-3 rounded-2xl inline-flex shadow-lg">
            <img src="/assets/logo_full.png" alt="Intel Counselling" className="h-8 w-auto object-contain" />
          </div>
          <Link to="/login" className="text-sm font-medium text-primary-700 hover:text-primary-800">Already registered? Sign in</Link>
        </div>

        <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
          <p className="text-surface-500 mt-1 mb-6 text-sm">
            For individuals and families who are not part of a school programme. Take the Intell assessments and talk to a counsellor.
          </p>

          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />
              <Input label="Last name" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />
            </div>
            <Input label="Email address" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
            <Input label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} hint="Used for payment and session coordination." />
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  className="form-input !pr-10"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-surface-600">
              <input type="checkbox" required checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 rounded border-surface-300" />
              <span>
                I agree to the <a className="text-primary-700 underline" href={`${MAIN_SITE_URL}/terms`} target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
                <a className="text-primary-700 underline" href={`${MAIN_SITE_URL}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and I consent to my assessment responses being stored and reviewed by Intel Counselling's counsellors.
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
          </form>

          <p className="mt-5 flex items-start gap-2 text-xs text-surface-400">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Your answers are private. Only you and the Intel Counselling team can see them.
          </p>
        </div>
      </div>
    </div>
  );
}
