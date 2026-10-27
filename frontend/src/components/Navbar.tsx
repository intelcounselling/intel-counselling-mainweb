import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Menu, X, UserRound } from 'lucide-react';
import { clearAuthSession, authHeaders, useAuthUser } from '../utils/auth';
import { SCHOOL_PORTAL_URL } from '../utils/site';

interface NavbarProps {
  onBookClick: () => void;
}

// Home-page sections, plus the assessments page. The logo is the way home.
const NAV_LINKS = [
  { id: 'approach', label: 'Our approach' },
  { id: 'services', label: 'Services' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'founders', label: 'Our team' },
  { id: 'gallery', label: 'Gallery' },
];

// One bar everywhere: same shape on every page and at every scroll position,
// so the navigation never moves out from under the visitor.
const Navbar: React.FC<NavbarProps> = ({ onBookClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation
  useEffect(() => setIsMenuOpen(false), [location.pathname, location.hash]);

  const handleLogout = () => {
    // Fire-and-forget: revoke every outstanding session token server-side.
    // Local logout proceeds regardless of whether this call succeeds.
    fetch('/api/logout-all', { method: 'POST', headers: authHeaders() }).catch(() => {});
    clearAuthSession(true);
    navigate('/');
  };

  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (id === 'assessments') return navigate('/assessments');
    if (id === 'top') {
      if (location.pathname !== '/') navigate('/');
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (location.pathname !== '/') navigate(`/#${id}`);
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const hrefFor = (id: string) => (id === 'assessments' ? '/assessments' : `/#${id}`);
  const accountLabel = user ? 'My results' : 'Sign in';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] bg-[#1A1A1A] border-b transition-shadow ${
          scrolled ? 'border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.18)]' : 'border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto h-16 md:h-[72px] px-4 sm:px-6 lg:px-8 flex items-center gap-6" aria-label="Main">
          <a href="/" onClick={(e) => goTo(e, 'top')} className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
            <img src="/assets/imgs/logo_full.png" alt="Intel Counselling — home" className="h-9 md:h-11 w-auto object-contain" />
          </a>

          <ul className="hidden xl:flex items-center gap-1 mx-auto">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={hrefFor(link.id)}
                  onClick={(e) => goTo(e, link.id)}
                  className="px-3 py-2 rounded-lg text-[15px] font-medium text-white/75 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto xl:ml-0 flex items-center gap-1 sm:gap-2">
            {/* Separate, school-issued Mindbridge login — not the site account */}
            <a
              href={SCHOOL_PORTAL_URL}
              className="hidden lg:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              School portal
            </a>
            <button
              onClick={() => navigate(user ? '/my-results' : '/login')}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/85 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              {user ? <UserRound size={16} /> : <LogIn size={16} />} {accountLabel}
            </button>
            {user && (
              <button
                onClick={handleLogout}
                aria-label={`Log out (${user.name.split(' ')[0]})`}
                title="Log out"
                className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
            <button
              onClick={onBookClick}
              className="ml-1 inline-flex items-center px-4 md:px-5 h-10 rounded-full bg-terracotta text-intel-dark text-sm font-semibold hover:bg-[#cfac80] hover:scale-[1.04] transition-all duration-300 ease-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book<span className="hidden sm:inline">&nbsp;appointment</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/5"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {/* Animated wavy bottom edge, shown while at the top of the page */}
        <div
          className={`absolute left-0 right-0 -bottom-[24px] h-[25px] overflow-hidden pointer-events-none transition-opacity duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}
          aria-hidden="true"
        >
          <div className="nav-wave absolute bottom-0 w-[200%] h-full flex">
            {[0, 1].map((i) => (
              <svg key={i} className={`w-1/2 h-full shrink-0 ${i ? '-ml-px' : ''}`} preserveAspectRatio="none" viewBox="0 0 1440 30" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L0,15 C360,-10 360,40 720,15 C1080,-10 1080,40 1440,15 L1440,0 Z" fill="#1A1A1A" />
              </svg>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes navWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .nav-wave { animation: navWave 14s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .nav-wave { animation: none; } }
        `}</style>
      </header>

      {/* Mobile / tablet menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-[#1A1A1A] flex flex-col" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10">
            <img src="/assets/imgs/logo_full.png" alt="Intel Counselling" className="h-9 w-auto object-contain" />
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col">
            <ul className="divide-y divide-white/10">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={hrefFor(link.id)}
                    onClick={(e) => goTo(e, link.id)}
                    className="block py-4 text-xl font-semibold text-white serif"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/intell-assessment" className="block py-4 text-xl font-semibold text-white serif">Student assessments</a>
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => { onBookClick(); setIsMenuOpen(false); }}
                className="w-full h-12 rounded-full bg-terracotta text-intel-dark font-semibold"
              >
                Book appointment
              </button>
              <button
                onClick={() => { navigate(user ? '/my-results' : '/login'); setIsMenuOpen(false); }}
                className="w-full h-12 rounded-full border border-white/20 text-white font-semibold inline-flex items-center justify-center gap-2"
              >
                {user ? <UserRound size={18} /> : <LogIn size={18} />} {accountLabel}
              </button>
              {user && (
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full h-12 rounded-full text-white/70 font-medium inline-flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Log out ({user.name.split(' ')[0]})
                </button>
              )}
              <a href={SCHOOL_PORTAL_URL} className="mt-2 text-center text-sm text-white/55 py-2">
                School portal (Mindbridge)
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
