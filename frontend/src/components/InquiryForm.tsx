import React, { useState } from 'react';
import { Send, CheckCircle2, Sparkles, Mail, Phone, Clock, ShieldCheck, User, Users, Briefcase, MessageCircle, Smile, Heart, Check } from 'lucide-react';
import { apiClient } from '../utils/api';
import { CLINIC } from '../utils/site';

// Values are sent as-is in the inquiry email
const SERVICES = [
  { value: 'Personal Therapy', label: 'Personal therapy', icon: User, tint: 'bg-lavender' },
  { value: 'Student Growth', label: 'Student growth', icon: Users, tint: 'bg-sage' },
  { value: 'Corporate Wellness', label: 'Corporate wellness', icon: Briefcase, tint: 'bg-sky' },
  { value: 'General Inquiry', label: 'Just a question', icon: MessageCircle, tint: 'bg-peach' },
];

const CONTACT = [
  { icon: Mail, tint: 'bg-sky', label: CLINIC.email, href: CLINIC.emailHref },
  { icon: Phone, tint: 'bg-sage', label: CLINIC.phone, href: CLINIC.phoneHref },
  { icon: Clock, tint: 'bg-peach', label: 'We reply within a day' },
  { icon: ShieldCheck, tint: 'bg-lavender', label: 'Everything you share stays confidential' },
];

const FIELD =
  'w-full bg-white/80 border-2 border-transparent shadow-[0_2px_0_rgba(26,26,26,0.06)] rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-[15px] text-intel-dark placeholder:text-intel-dark/35 outline-none ' +
  'focus:bg-white focus:border-terracotta focus:ring-4 focus:ring-terracotta/15 focus:-translate-y-0.5 transition-all';
const ICON = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-intel-dark/35 peer-focus:text-terracotta transition-colors';
const LABEL = 'block text-sm font-semibold text-intel-dark/70 mb-1.5 ml-1';

const InquiryForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', service: 'Personal Therapy', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.post<any>('/api/send-inquiry-email', formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', service: 'Personal Therapy', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
      {/* Left: invitation + ways to reach us */}
      <div className="text-[#F4EFE6] lg:pt-6">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta mb-3"><Sparkles size={14} /> Get in touch</p>
        <h2 className="serif text-3xl md:text-[2.75rem] leading-tight">
          Send us a <span className="italic text-terracotta">message</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-white/65 leading-relaxed max-w-md">
          Not sure where to start? Tell us a little about what's on your mind and we'll help you find the right next step.
        </p>
        <ul className="mt-8 space-y-3">
          {CONTACT.map(({ icon: Icon, tint, label, href }) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-intel-dark ${tint}`} aria-hidden="true"><Icon size={18} /></span>
              {href
                ? <a href={href} className="text-[15px] text-white/80 hover:text-white underline-offset-4 hover:underline">{label}</a>
                : <span className="text-[15px] text-white/70">{label}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Right: the form card */}
      <div className="relative">
        {/* Tilted pastel cards peeking out from behind */}
        <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-peach rotate-[3deg] translate-x-2 translate-y-2" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-sage -rotate-[2deg] -translate-x-1 translate-y-1" aria-hidden="true" />
        {/* Speech-bubble sticker */}
        <span className="inquiry-bob absolute -top-5 right-5 sm:right-8 z-10 inline-flex items-center gap-1.5 rounded-full bg-terracotta text-intel-dark px-4 py-2 text-sm font-semibold shadow-[0_8px_18px_rgba(0,0,0,0.3)] rotate-[5deg]" aria-hidden="true">
          <Smile size={16} /> We read every message
          <span className="absolute -bottom-1.5 left-6 w-3.5 h-3.5 bg-terracotta rotate-45 rounded-[2px]" />
        </span>
        <Heart className="inquiry-bob pointer-events-none absolute -left-4 top-24 text-[#9C5B47]/70 hidden sm:block" size={22} aria-hidden="true" />
        <Sparkles className="inquiry-bob pointer-events-none absolute -right-4 bottom-20 text-terracotta hidden sm:block" size={24} aria-hidden="true" />

      <div className="relative bg-[#F7EBD3] rounded-[32px] p-6 sm:p-8 md:p-10 pt-10 sm:pt-12 text-intel-dark shadow-[0_20px_50px_rgba(0,0,0,0.35)]">

        {isSubmitted ? (
          <div className="relative text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-sage text-serene-green rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="serif text-2xl sm:text-3xl">Message received</h3>
            <p className="mt-3 text-[15px] text-intel-dark/70 max-w-sm mx-auto leading-relaxed">
              Thank you for reaching out. Someone from our team will get back to you within a day.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-8 inline-flex items-center h-11 px-6 rounded-full bg-white text-intel-dark text-sm font-semibold border border-black/5 hover:bg-white/70"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="inq-name" className={LABEL}>Your name</label>
                <div className="relative">
                  <input id="inq-name" required type="text" placeholder="Your name" className={`peer ${FIELD}`}
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <User size={16} className={ICON} aria-hidden="true" />
                </div>
              </div>
              <div>
                <label htmlFor="inq-email" className={LABEL}>Email</label>
                <div className="relative">
                  <input id="inq-email" required type="email" placeholder="you@example.com" className={`peer ${FIELD}`}
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <Mail size={16} className={ICON} aria-hidden="true" />
                </div>
              </div>
            </div>

            <fieldset>
              <legend className={LABEL}>What can we help with?</legend>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(({ value, label, icon: Icon, tint }) => {
                  const on = formData.service === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFormData({ ...formData, service: value })}
                      className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold border-2
                        ${on ? `${tint} border-intel-dark/30 text-intel-dark shadow-[0_3px_0_rgba(26,26,26,0.15)] -rotate-1` : 'bg-white/60 border-transparent text-intel-dark/65 hover:bg-white'}`}
                    >
                      {on ? <Check size={14} /> : <Icon size={14} />} {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="inq-message" className={LABEL}>Your message</label>
              <div className="relative">
                <textarea id="inq-message" required rows={4} placeholder="Tell us a little about what you're looking for..."
                  className={`peer ${FIELD} resize-none`}
                  value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                <MessageCircle size={16} className="pointer-events-none absolute left-4 top-4 text-intel-dark/35 peer-focus:text-terracotta transition-colors" aria-hidden="true" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl border border-red-100 text-sm font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-serene-green text-white font-semibold
                         shadow-[0_5px_0_#122925,0_10px_22px_rgba(28,63,57,0.3)] hover:bg-[#24524a] active:shadow-[0_1px_0_#122925] disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send message'}
              {!isSubmitting && <Send size={16} className="transition-transform duration-500 ease-bounce group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:rotate-12" />}
            </button>
          </form>
        )}
      </div>
      </div>
      <style>{`
        @keyframes inquiryBob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -6px; } }
        .inquiry-bob { animation: inquiryBob 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .inquiry-bob { animation: none; } }
      `}</style>
    </div>
  );
};

export default InquiryForm;
