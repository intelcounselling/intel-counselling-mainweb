
import React from 'react';
import { Heart, Mail, Phone, MapPin, Twitter, Instagram, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1F1E1B] text-white pt-14 sm:pt-20 md:pt-24 pb-10 sm:pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Grid: 1 col mobile → 2 col sm → 4 col md */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16 md:mb-20">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-5 sm:mb-8">
              <div className="p-1.5 bg-terracotta rounded-lg text-white">
                <Heart size={18} fill="currentColor" />
              </div>
              <span className="font-bold text-xl sm:text-2xl tracking-tight">Intel Counselling</span>
            </div>
            <p className="text-white/60 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              Dedicated to providing compassionate, research-driven mental health care.
              Covering the emotional needs of individuals across different life stages —
              from children and adolescents to adults and senior citizens.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <SocialIcon icon={<Twitter size={16} />} label="Twitter" />
              <SocialIcon icon={<Instagram size={16} />} label="Instagram" />
              <SocialIcon icon={<Facebook size={16} />} label="Facebook" />
            </div>
          </div>

          {/* Clinic links */}
          <div>
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Clinic</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Our Approach</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Practitioners</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Therapy Services</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Self-Assessment</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Resources</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Wellness Blog</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Crisis Support</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">Patient Portal</a></li>
              <li><a href="#" className="hover:text-terracotta transition-colors duration-300">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Contact</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-terracotta shrink-0 mt-0.5 sm:mt-1" />
                <span className="leading-relaxed">
                  144, Seetha Patabi Nagar,<br />
                  Maruthi Nagar, Ayappakkam,<br />
                  Chennai, Tamil Nadu 600077, India.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-terracotta shrink-0" />
                <span>+91 9363524174</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-terracotta shrink-0" />
                <span className="break-all">intelcounselling@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 sm:pt-12 text-xs sm:text-sm text-white/40">
          <div className="mb-6 sm:mb-8">
            <h5 className="font-bold text-white/60 uppercase tracking-widest text-[9px] sm:text-[10px] mb-3 sm:mb-4">Disclaimer</h5>
            <p className="leading-relaxed text-xs sm:text-sm">
              All assessments provided by Intell Counselling are screening and guidance tools designed to enhance self-understanding
              and developmental planning. They are not diagnostic instruments and do not replace clinical evaluation or standardized
              psychological testing. Always seek the advice of your physician or other qualified health provider.
              <br /><br />
              If you are experiencing a mental health crisis or emergency, please call your local emergency services or the
              National Suicide Prevention Lifeline at <strong className="text-white/60">988</strong> immediately.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p>© 2026 Intel Counselling. All rights reserved.</p>
            <div className="flex gap-5 sm:gap-8">
              <a href="#" className="hover:text-white transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <a
    href="#" aria-label={label}
    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center
               text-white/60 hover:text-white hover:bg-terracotta hover:scale-110
               transition-all duration-300 ease-out active:scale-90"
  >
    {icon}
  </a>
);

export default Footer;
