import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { apiClient } from '../utils/api';
import { setAuthSession, getAuthToken } from '../utils/auth';
import { AssessmentPage, StackedCard, BackPill, BTN_PRIMARY, FIELD, FIELD_LABEL } from './AssessmentUI';

interface AssessmentRegistrationProps {
  // Shown when the intake gates a test; omitted on the standalone /profile page
  testTitle?: string;
  onComplete: () => void;
  onClose: () => void;
}

// Intake form, filled once per account and stored (encrypted) server-side.
// Re-opening it pre-fills the saved details so they can be edited.
const AssessmentRegistration: React.FC<AssessmentRegistrationProps> = ({ testTitle, onComplete, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    occupation: '',
    reason: '',
    consent: false
  });
  const [loaded, setLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<any>('/api/profile')
      .then((data) => {
        const p = data.profile || {};
        setFormData((f) => ({
          ...f,
          name: data.user?.name || '',
          email: data.user?.email || '',
          phone: p.phone || data.user?.phone || '',
          age: p.age || '',
          gender: p.gender || '',
          occupation: p.occupation || '',
          reason: p.reason || '',
          consent: !!data.profile,
        }));
      })
      .catch((err) => setError(err.message || 'Could not load your details.'))
      .finally(() => setLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setError('Please consent to the privacy and assessment terms.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { name, phone, age, gender, occupation, reason } = formData;
      const data = await apiClient.put<any>('/api/profile', { name, phone, age, gender, occupation, reason, consent: formData.consent });
      // Keep the cached session user (navbar name etc.) in step with the account
      setAuthSession(data.user, getAuthToken());

      // First intake only: notify the clinic of the new client (best effort)
      if (data.firstTime) {
        apiClient.post('/api/send-registration-email', {
          ...formData,
          testTitle: testTitle || 'Account intake',
          registeredAt: new Date().toLocaleString(),
        }).catch((err) => console.warn('Registration notification failed:', err));
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not save your details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <AssessmentPage align="center">
        <Loader2 size={32} className="animate-spin text-terracotta" />
      </AssessmentPage>
    );
  }

  return (
    <AssessmentPage align="center">
      <StackedCard maxW="max-w-2xl" className="as-pop">
        <div className="p-6 md:p-12">
          <BackPill onClick={onClose}><ArrowLeft size={16} /> Back</BackPill>

          {/* Header */}
          <div className="text-center mt-6 mb-10">
            <div className="as-bob inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lavender text-intel-dark/80 text-[12px] font-semibold mb-4">
              <Sparkles size={13} />
              Basic details
            </div>
            <h2 className="serif text-3xl md:text-4xl text-intel-dark mb-4 leading-tight">
              Client <span className="italic text-serene-green">information</span>
            </h2>
            <p className="text-intel-dark/60 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              {testTitle
                ? <>Please provide your basic details before we begin the <strong>{testTitle}</strong>. You only need to do this once.</>
                : <>These details are saved securely on your account and used for every assessment.</>}
            </p>
          </div>

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label htmlFor="reg-name" className={FIELD_LABEL}><User size={14} /> Full name</label>
                <input id="reg-name" required type="text" placeholder="Full name" className={FIELD}
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div>
                <label htmlFor="reg-email" className={FIELD_LABEL}><Mail size={14} /> Email address</label>
                <input id="reg-email" readOnly type="email" title="Your account email"
                  className="w-full bg-black/[0.04] border-2 border-transparent rounded-2xl px-5 py-3.5 text-base outline-none text-intel-dark/55 font-medium cursor-not-allowed"
                  value={formData.email} />
              </div>

              <div>
                <label htmlFor="reg-phone" className={FIELD_LABEL}><Phone size={14} /> Phone number</label>
                <input id="reg-phone" required type="tel" placeholder="Phone number" className={FIELD}
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div>
                <label htmlFor="reg-age" className={FIELD_LABEL}><Calendar size={14} /> Age</label>
                <input id="reg-age" required type="number" min="10" max="100" placeholder="Your age" className={FIELD}
                  value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </div>

              <div>
                <label htmlFor="reg-gender" className={FIELD_LABEL}>Gender</label>
                <select id="reg-gender" required className={`${FIELD} cursor-pointer`}
                  value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-occ" className={FIELD_LABEL}>Education / occupation</label>
                <select id="reg-occ" required className={`${FIELD} cursor-pointer`}
                  value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}>
                  <option value="">Select status...</option>
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Homemaker">Homemaker</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reg-reason" className={FIELD_LABEL}><Heart size={14} /> Primary concerns / reason for assessment (optional)</label>
              <textarea id="reg-reason" rows={3}
                placeholder="E.g., mapping out future career streams, feeling overwhelmed by studies/work, sleep difficulties, general self-understanding..."
                className={`${FIELD} resize-none`}
                value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
            </div>

            {/* Privacy & consent */}
            <div className="p-5 bg-sage/70 rounded-3xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  required
                  type="checkbox"
                  className="w-5 h-5 mt-0.5 rounded accent-[#1C3F39] shrink-0 cursor-pointer"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                />
                <span className="text-xs text-intel-dark/75 font-medium leading-relaxed">
                  I agree to Intel Counselling storing these details and my assessment answers (encrypted) to give me my results and reports, and to share them with my counsellor only when I choose to (for example when I book a session). Our payment, email and video-call providers process data for us under contract; we never sell it. If I am under 18, a parent or guardian will also need to agree. I can download or delete my data at any time. See the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
                </span>
              </label>
            </div>

            {error && (
              <div role="alert" className="bg-[#F9D9D4] text-red-800 px-4 py-3 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-5">
              <button type="submit" disabled={isSubmitting} className={`${BTN_PRIMARY} w-full sm:flex-1 group`}>
                {isSubmitting ? 'Saving...' : testTitle ? 'Save & start' : 'Save details'}
                {!isSubmitting && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2 text-[12px] font-semibold text-intel-dark/55 whitespace-nowrap">
                <ShieldCheck size={14} className="text-serene-green" /> Strictly confidential
              </p>
            </div>
          </form>
        </div>
      </StackedCard>
    </AssessmentPage>
  );
};

export default AssessmentRegistration;
