
import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../utils/api';

const InquiryForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Personal Therapy',
    message: ''
  });
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

  if (isSubmitted) {
    return (
      <div className="bg-[#F7EBD3] rounded-2xl sm:rounded-[28px] md:rounded-[32px] p-8 sm:p-12 md:p-20 text-center shadow-2xl border border-white/10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-terracotta/20 text-terracotta rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
          <CheckCircle2 size={32} className="sm:hidden" />
          <CheckCircle2 size={40} className="hidden sm:block" />
        </div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6 serif text-intel-dark">Inquiry Received</h3>
        <p className="text-base sm:text-lg md:text-xl text-intel-dark/70 max-w-md mx-auto leading-relaxed mb-8 sm:mb-10 font-light">
          Thank you for reaching out. One of our specialists will review your message and get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-terracotta font-black uppercase tracking-[0.1em] text-xs hover:opacity-70 transition-opacity"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F7EBD3] rounded-2xl sm:rounded-[28px] md:rounded-[32px] p-5 sm:p-8 md:p-10 text-intel-dark shadow-2xl relative z-10 border border-white/10">
      {/* Form header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-7 sm:mb-10">
        <div>
          <h3 className="text-3xl md:text-4xl serif leading-tight">Send us a message</h3>
        </div>
        <p className="text-intel-dark/60 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-sm">
          Have questions or need guidance on where to start? We're here to listen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Name + Email — stack on mobile, 2-col on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-intel-dark/70 ml-1">
              Full name
            </label>
            <input
              required type="text" placeholder="Your name"
              className="w-full bg-white border border-black/5 rounded-xl sm:rounded-2xl
                         px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base outline-none
                         focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-intel-dark/70 ml-1">
              Email address
            </label>
            <input
              required type="email" placeholder="you@example.com"
              className="w-full bg-white border border-black/5 rounded-xl sm:rounded-2xl
                         px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base outline-none
                         focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        {/* Service select */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-intel-dark/70 ml-1">
            Service you're interested in
          </label>
          <select
            className="w-full bg-white border border-black/5 rounded-xl sm:rounded-2xl
                       px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base outline-none
                       focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 transition-all
                       appearance-none cursor-pointer"
            value={formData.service}
            onChange={e => setFormData({ ...formData, service: e.target.value })}
          >
            <option>Personal Therapy</option>
            <option>Student Growth</option>
            <option>Corporate Wellness</option>
            <option>General Inquiry</option>
          </select>
        </div>

        {/* Message */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-intel-dark/70 ml-1">
            How can we help?
          </label>
          <textarea
            required rows={4} placeholder="Tell us a little about what you're looking for..."
            className="w-full bg-white border border-black/5 rounded-xl sm:rounded-2xl
                       px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base outline-none
                       focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 transition-all resize-none"
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            type="submit" disabled={isSubmitting}
            className="w-full sm:w-auto bg-terracotta text-intel-dark px-8 sm:px-10 py-4
                       rounded-full font-semibold text-base
                       hover:opacity-90 active:scale-[0.98] transition-all
                       shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {isSubmitting ? 'Sending…' : 'Send message'}
            {!isSubmitting && <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
          </button>
          <p className="text-sm text-intel-dark/55 text-center sm:text-left">
            Everything you share is kept confidential.
          </p>
        </div>
      </form>
    </div>
  );
};

export default InquiryForm;
