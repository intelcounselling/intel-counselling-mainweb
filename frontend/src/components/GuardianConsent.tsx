import React, { useState } from 'react';
import { ShieldCheck, Mail, User, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/api';
import { AssessmentPage, StackedCard, BackPill, IconTile, BTN_GREEN, FIELD, FIELD_LABEL } from './AssessmentUI';

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

  return (
    <AssessmentPage>
      <StackedCard maxW="max-w-xl" className="as-pop">
        <div className="p-7 md:p-12">
          {onClose && <div className="mb-6"><BackPill onClick={onClose}><ArrowLeft size={16} /> Back</BackPill></div>}
          <div className="mb-6"><IconTile tint="bg-sage" size="md"><ShieldCheck size={26} /></IconTile></div>
          <h2 className="serif text-3xl text-intel-dark mb-3">Ask a parent to <span className="italic text-serene-green">say yes</span></h2>
          <p className="text-intel-dark/70 leading-relaxed mb-6">
            Because you're under 18, Indian law needs a parent or guardian to agree before we save your answers.
            We'll email them a 6-digit code. They should read what we do with your answers in our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-serene-green">Privacy Policy</a> before sharing the code with you.
          </p>

          {error && <div role="alert" className="mb-5 rounded-2xl bg-[#F9D9D4] p-4 text-sm text-red-800">{error}</div>}

          {step === 'details' ? (
            <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4">
              <label className="block">
                <span className={FIELD_LABEL}>Parent / guardian name</span>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
                  <input required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={`${FIELD} !pl-11`} autoComplete="off" />
                </div>
              </label>
              <label className="block">
                <span className={FIELD_LABEL}>Their email</span>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
                  <input required type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className={`${FIELD} !pl-11`} autoComplete="off" />
                </div>
              </label>
              <button type="submit" disabled={busy} className={`${BTN_GREEN} w-full`}>
                {busy && <Loader2 size={16} className="animate-spin" />} Email them a code
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4">
              <p className="text-sm text-intel-dark/70">We sent a code to <strong>{guardianEmail}</strong>. Enter it here once your parent or guardian has agreed.</p>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/40" />
                <input required inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={`${FIELD} !pl-11 tracking-[0.4em] text-lg`} placeholder="000000" aria-label="6-digit code" />
              </div>
              <button type="submit" disabled={busy || otp.length !== 6} className={`${BTN_GREEN} w-full`}>
                {busy && <Loader2 size={16} className="animate-spin" />} Confirm consent
              </button>
              <button type="button" onClick={() => { setStep('details'); setOtp(''); }} className="w-full text-sm font-semibold text-intel-dark/60 hover:text-intel-dark underline underline-offset-4">Use a different email / send again</button>
            </form>
          )}
        </div>
      </StackedCard>
    </AssessmentPage>
  );
};

export default GuardianConsent;
