import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Menu, X, UserRound, Compass, HeartHandshake, ClipboardList, Users, Images, GraduationCap, School } from 'lucide-react';
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

// Icon + tint for each link in the mobile menu
const MENU_STYLE: Record<string, { icon: React.ElementType; tint: string }> = {
  approach: { icon: Compass, tint: 'bg-sage' },
  services: { icon: HeartHandshake, tint: 'bg-peach' },
  assessments: { icon: ClipboardList, tint: 'bg-lavender' },
  founders: { icon: Users, tint: 'bg-sky' },
  gallery: { icon: Images, tint: 'bg-peach' },
};

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

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

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
              onClick={() => setIsMenuOpen((o) => !o)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/5"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
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

      {/* Mobile / tablet menu: a compact panel under the header, not a full page */}
      {isMenuOpen && (
        <>
          <button
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-x-0 top-16 bottom-0 z-[105] bg-black/50 backdrop-blur-[2px] cursor-default"
          />
          <div
            className="fixed z-[110] top-[72px] left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] max-h-[calc(100vh-88px)] overflow-y-auto
                       rounded-3xl bg-[#1F1E1B] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-3"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <ul className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((link) => {
                const { icon: Icon, tint } = MENU_STYLE[link.id];
                return (
                  <li key={link.id}>
                    <a
                      href={hrefFor(link.id)}
                      onClick={(e) => goTo(e, link.id)}
                      className="flex items-center gap-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/10 px-3 py-3 text-[15px] font-medium text-white transition-colors"
                    >
                      <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-intel-dark ${tint}`} aria-hidden="true"><Icon size={17} /></span>
                      {link.label}
                    </a>
                  </li>
                );
              })}
              <li>
                <a
                  href="/intell-assessment"
                  className="flex items-center gap-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/10 px-3 py-3 text-[15px] font-medium text-white transition-colors"
                >
                  <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-intel-dark bg-sage" aria-hidden="true"><GraduationCap size={17} /></span>
                  Student tests
                </a>
              </li>
            </ul>

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => { onBookClick(); setIsMenuOpen(false); }}
                className="w-full h-12 rounded-full bg-terracotta text-intel-dark font-semibold hover:bg-[#cfac80]"
              >
                Book appointment
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { navigate(user ? '/my-results' : '/login'); setIsMenuOpen(false); }}
                  className="h-11 rounded-full border border-white/20 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/5"
                >
                  {user ? <UserRound size={16} /> : <LogIn size={16} />} {accountLabel}
                </button>
                <a
                  href={SCHOOL_PORTAL_URL}
                  className="h-11 rounded-full border border-white/10 text-white/70 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white"
                >
                  <School size={16} /> School portal
                </a>
              </div>
              {user && (
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full h-10 rounded-full text-white/60 text-sm font-medium inline-flex items-center justify-center gap-2 hover:text-white"
                >
                  <LogOut size={15} /> Log out ({user.name.split(' ')[0]})
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
