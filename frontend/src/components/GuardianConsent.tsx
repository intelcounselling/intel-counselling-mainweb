import React, { useState } from 'react';
import { ShieldCheck, Mail, User, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/api';

interface Props {
  onVerified: () => void;
  onClose?: () => void;
}

// Under-18 accounts (DPDP Act): a parent or guardian confirms consent with a code
// sent to their own email before any assessment is saved.
const GuardianConsent: React.FC<Props> = ({ onVerified, onClose }) => {
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.data?.error || e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => call(async () => {
    await apiClient.post('/api/guardian-consent/start', { guardianName, guardianEmail });
    setStep('code');
  });
  const verify = () => call(async () => {
    await apiClient.post('/api/guardian-consent/verify', { otp });
    onVerified();
  });

  const input = 'w-full bg-[#F6F7F9] border border-black/10 rounded-2xl pl-11 pr-4 py-4 text-intel-dark focus:outline-none focus:border-serene-green';

  return (
    <div className="min-h-screen bg-[#F6F7F9] pt-24 md:pt-32 pb-12 px-4 flex items-start justify-center">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-xl border border-black/5 p-8 md:p-12">
        {onClose && (
          <button onClick={onClose} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black/80 mb-6">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <span className="w-14 h-14 rounded-2xl bg-serene-green text-white flex items-center justify-center mb-6"><ShieldCheck size={26} /></span>
        <h2 className="text-3xl serif text-intel-dark mb-3">Ask a parent to say yes</h2>
        <p className="text-intel-dark/70 leading-relaxed mb-6">
          Because you're under 18, Indian law needs a parent or guardian to agree before we save your answers.
          We'll email them a 6-digit code. They should read what we do with your answers in our{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-serene-green">Privacy Policy</a> before sharing the code with you.
        </p>

        {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {step === 'details' ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-intel-dark/50">Parent / guardian name</span>
              <div className="relative mt-2">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
                <input required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={input} autoComplete="off" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-intel-dark/50">Their email</span>
              <div className="relative mt-2">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
                <input required type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className={input} autoComplete="off" />
              </div>
            </label>
            <button type="submit" disabled={busy} className="w-full bg-serene-green text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 size={16} className="animate-spin" />} Email them a code
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4">
            <p className="text-sm text-intel-dark/70">We sent a code to <strong>{guardianEmail}</strong>. Enter it here once your parent or guardian has agreed.</p>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
              <input required inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={`${input} tracking-[0.4em] text-lg`} placeholder="000000" aria-label="6-digit code" />
            </div>
            <button type="submit" disabled={busy || otp.length !== 6} className="w-full bg-serene-green text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {busy && <Loader2 size={16} className="animate-spin" />} Confirm consent
            </button>
            <button type="button" onClick={() => { setStep('details'); setOtp(''); }} className="w-full text-sm text-intel-dark/60 underline">Use a different email / send again</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GuardianConsent;
