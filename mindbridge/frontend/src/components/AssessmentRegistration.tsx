import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, ArrowRight, Loader2, Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface AssessmentRegistrationProps {
  testId: string;
  onComplete: (data: any) => void;
  onClose: () => void;
}

const AssessmentRegistration: React.FC<AssessmentRegistrationProps> = ({ testId, onComplete, onClose }) => {
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getTestTitle = () => {
    switch (testId) {
      case 'career': return 'Career Guidance Assessment';
      case 'phq9': return 'Depression Screening (PHQ-9)';
      case 'gad7': return 'Anxiety Screening (GAD-7)';
      case 'pss10': return 'Stress Self-Check (PSS-10)';
      case 'sleep': return 'Sleep Hygiene Check';
      default: return 'Self-Assessment';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setError('Please consent to the privacy and assessment terms.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // Send registration alert email to admin
      const response = await fetch('/api/send-registration-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          testId,
          testTitle: getTestTitle(),
          registeredAt: new Date().toLocaleString()
        })
      });

      if (!response.ok) {
        // Log it, but we won't block the user from proceeding if the mail API fails (e.g. key missing/offline dev mode)
        const data = await response.json();
        console.warn('Mail dispatch warning:', data.error || 'Failed to dispatch email alert');
      }
      
      // Save details to localStorage
      localStorage.setItem('assessment_registration', JSON.stringify(formData));
      
      // Call onComplete to proceed to the test
      onComplete(formData);
    } catch (err: any) {
      console.error('Registration dispatch error:', err);
      // Fallback: save to localStorage and let the user take the test even if offline or API fails
      localStorage.setItem('assessment_registration', JSON.stringify(formData));
      onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] pt-20 md:pt-28 pb-12 px-4 flex items-center justify-center">
      <div className="relative bg-white w-full max-w-2xl p-6 md:p-12 rounded-[40px] shadow-xl border border-black/5 animate-in fade-in duration-500">
        
        {/* Back Button */}
        <button 
          onClick={onClose} 
          className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black/80 transition-colors"
        >
          &larr; Back
        </button>

        {/* Header Section */}
        <div className="text-center mt-6 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark/5 border border-black/5 text-terracotta text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles size={12} className="animate-pulse" />
            Registration Required
          </div>
          <h2 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-4">
            Before we begin...
          </h2>
          <p className="text-intel-dark/60 max-w-md mx-auto text-sm md:text-base font-light leading-relaxed">
            Please provide basic details to register and initialize your <strong>{getTestTitle()}</strong>. Your privacy is strictly protected.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                <User size={12} /> Full Name
              </label>
              <input 
                required
                type="text" 
                placeholder="Full name"
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                <Mail size={12} /> Email Address
              </label>
              <input 
                required
                type="email" 
                placeholder="email@example.com"
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                <Phone size={12} /> Phone Number
              </label>
              <input 
                required
                type="tel" 
                placeholder="Phone number"
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                <Calendar size={12} /> Age
              </label>
              <input 
                required
                type="number" 
                min="10"
                max="100"
                placeholder="Your age"
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                Gender
              </label>
              <select 
                required
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium cursor-pointer"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Education / Occupation */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                Education / Occupation
              </label>
              <select 
                required
                className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium cursor-pointer"
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
              >
                <option value="">Select Status...</option>
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Homemaker">Homemaker</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reason for Assessment */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
              <Heart size={12} /> Primary Concerns / Reason for Assessment (Optional)
            </label>
            <textarea 
              rows={3}
              placeholder="E.g., mapping out future career streams, feeling overwhelmed by studies/work, sleep difficulties, general self-understanding..."
              className="w-full bg-[#F4EFE6]/30 border border-black/5 rounded-2xl px-5 py-3.5 text-base outline-none focus:border-terracotta focus:bg-white focus:ring-4 focus:ring-terracotta/10 transition-all text-intel-dark font-medium resize-none"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            ></textarea>
          </div>

          {/* Privacy & Consent */}
          <div className="p-4 bg-serene-green/5 border border-serene-green/10 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                required
                type="checkbox" 
                className="w-5 h-5 mt-0.5 rounded border-black/10 text-serene-green focus:ring-serene-green shrink-0 cursor-pointer"
                checked={formData.consent}
                onChange={(e) => setFormData({...formData, consent: e.target.checked})}
              />
              <span className="text-xs text-intel-dark/70 font-semibold leading-relaxed">
                I consent to providing this basic information for initial registration and assessment purposes. My data will remain strictly confidential and will not be shared with third parties.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 bg-terracotta text-white px-12 py-6 rounded-3xl font-black text-base uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Registering...' : 'Register & Start'} 
              {!isSubmitting && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-serene-green" /> Strictly Confidential
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentRegistration;
