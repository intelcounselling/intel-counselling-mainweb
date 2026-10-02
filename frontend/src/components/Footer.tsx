import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';
import { CLINIC, SCHOOL_PORTAL_URL } from '../utils/site';

const linkClass = 'hover:text-terracotta transition-colors duration-300';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1F1E1B] text-white pt-14 sm:pt-20 md:pt-24 pb-10 sm:pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Grid: 1 col mobile → 2 col sm → 4 col md */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16 md:mb-20">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5 sm:mb-8 w-fit">
              <div className="p-1.5 bg-terracotta rounded-lg text-white">
                <Heart size={18} fill="currentColor" />
              </div>
              <span className="font-bold text-xl sm:text-2xl tracking-tight">Intel Counselling</span>
            </Link>
            <p className="text-white/60 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              Dedicated to providing compassionate, research-driven mental health care.
              Covering the emotional needs of individuals across different life stages —
              from children and adolescents to adults and senior citizens.
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center bg-terracotta text-white rounded-full px-6 py-3 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Book an Appointment
            </Link>
          </div>

          {/* Clinic links */}
          <nav aria-label="Clinic">
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Clinic</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li><Link to="/#approach" className={linkClass}>Our Approach</Link></li>
              <li><Link to="/#founders" className={linkClass}>Practitioners</Link></li>
              <li><Link to="/#services" className={linkClass}>Therapy Services</Link></li>
              <li><Link to="/assessments" className={linkClass}>Self-Assessment</Link></li>
              <li><Link to="/career-assessment" className={linkClass}>Career Guidance</Link></li>
              <li><Link to="/intell-assessment" className={linkClass}>Intell Student Assessments</Link></li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Resources</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li><Link to="/crisis-support" className={linkClass}>Crisis Support</Link></li>
              <li><Link to="/my-results" className={linkClass}>My Account &amp; Results</Link></li>
              <li><Link to="/#inquiry" className={linkClass}>Contact Us</Link></li>
              <li><a href={SCHOOL_PORTAL_URL} className={linkClass}>School Portal</a></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-base sm:text-xl mb-5 sm:mb-8">Contact</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
              <li>
                <a href={CLINIC.mapsHref} target="_blank" rel="noopener noreferrer" className={`flex items-start gap-3 ${linkClass}`}>
                  <MapPin size={16} className="text-terracotta shrink-0 mt-0.5 sm:mt-1" />
                  <span className="leading-relaxed">
                    {CLINIC.addressLines.map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}
                  </span>
                </a>
              </li>
              <li>
                <a href={CLINIC.phoneHref} className={`flex items-center gap-3 ${linkClass}`}>
                  <Phone size={16} className="text-terracotta shrink-0" />
                  <span>{CLINIC.phone}</span>
                </a>
              </li>
              <li>
                <a href={CLINIC.emailHref} className={`flex items-center gap-3 ${linkClass}`}>
                  <Mail size={16} className="text-terracotta shrink-0" />
                  <span className="break-all">{CLINIC.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 sm:pt-12 text-xs sm:text-sm text-white/40">
          <div className="mb-6 sm:mb-8">
            <h5 className="font-bold text-white/60 uppercase tracking-widest text-[9px] sm:text-[10px] mb-3 sm:mb-4">Disclaimer</h5>
            <p className="leading-relaxed text-xs sm:text-sm">
              All assessments provided by Intel Counselling are screening and guidance tools designed to enhance self-understanding
              and developmental planning. They are not diagnostic instruments and do not replace clinical evaluation or standardized
              psychological testing. Always seek the advice of your physician or other qualified health provider.
              <br /><br />
              If you are experiencing a mental health crisis or emergency, call <a href="tel:112" className="text-white/70 underline">112</a> or
              the Tele-MANAS helpline at <a href="tel:14416" className="text-white/70 underline">14416</a> immediately. See{' '}
              <Link to="/crisis-support" className="text-white/70 underline">Crisis Support</Link> for more help.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p>© {new Date().getFullYear()} Intel Counselling. All rights reserved.</p>
            <div className="flex gap-5 sm:gap-8">
              <Link to="/privacy" className="hover:text-white transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
