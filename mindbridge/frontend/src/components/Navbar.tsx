
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Info, Users, Calendar, Heart, Layers, LogIn, Menu, X, Image as ImageIcon } from 'lucide-react';

interface NavbarProps {
  onBookClick: () => void;
  onAssessmentClick?: () => void;
  onLoginClick?: () => void;
  onLogoClick?: () => void;
  forcePill?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onBookClick, onAssessmentClick, onLoginClick, onLogoClick, forcePill }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isPill = forcePill || scrolled;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = () => {
      try {
        const saved = localStorage.getItem('auth_user');
        setUser(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
    // Periodically poll local storage or run on focus to ensure sync
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero');
      const threshold = heroSection ? heroSection.offsetHeight / 2 : 300;
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (id === 'top') {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      onLogoClick?.();
    } else {
      if (location.pathname !== '/') {
        navigate(`/#${id}`);
      } else {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLinks = [
    { id: 'top', label: 'Home', icon: <Home size={18} /> },
    { id: 'approach', label: 'Approach', icon: <Info size={18} /> },
    { id: 'services', label: 'Services', icon: <Layers size={18} /> },
    { id: 'gallery', label: 'Gallery', icon: <ImageIcon size={18} /> },
    { id: 'founders', label: 'Founders', icon: <Users size={18} /> },
  ];

  return (
    <>
    <nav className={`fixed z-[100] pointer-events-auto ${
      isPill
        ? 'top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl rounded-full bg-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] border border-white/10'
        : 'top-0 left-0 right-0 w-full bg-intel-dark shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
    }`}>
      <div 
        className={`relative z-10 flex items-center w-full max-w-[1440px] mx-auto justify-between gap-1 sm:gap-3 ${
          isPill
            ? 'px-2 sm:px-6 py-1.5 sm:py-3'
            : 'px-3 sm:px-6 lg:px-12 pt-3 pb-1 lg:pt-7 lg:pb-2'
        }`}
      >
        {/* Brand/Logo Section */}
        <div 
          className="flex items-center cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
          onClick={(e) => handleNavClick(e as any, 'top')}
        >
          {isPill
            ? <img src="/assets/imgs/logo_small.png" alt="Intel Counselling" className="h-7 md:h-10 w-auto object-contain" />
            : <img src="/assets/imgs/logo_full.png" alt="Intel Counselling" className="h-10 md:h-16 lg:h-20 w-auto object-contain" />
          }
        </div>

        {/* Center Navigation Links - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex items-center gap-0.5 sm:gap-4 lg:gap-8 mx-auto xl:ml-24 overflow-x-auto no-scrollbar mask-edges">
          {navLinks.map((link) => (
            <a 
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="relative flex items-center justify-center transition-all duration-300 group px-1.5 sm:px-3 py-2 rounded-full hover:bg-white/5"
            >
              <span className="text-[11px] lg:text-sm font-bold tracking-tight whitespace-nowrap opacity-80 group-hover:text-white group-hover:opacity-100 text-white hidden md:block">
                {link.label}
              </span>
              <span className="text-white/70 group-hover:text-white md:hidden">
                {React.cloneElement(link.icon as React.ReactElement, { size: 16 })}
              </span>
            </a>
          ))}
        </div>

        {/* Action Buttons - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex items-center gap-1 lg:gap-3 ml-0.5 shrink-0">
          <button 
            onClick={onBookClick}
            className="flex items-center justify-center bg-serene-green text-white rounded-full font-bold transition-all duration-300 shadow-lg active:scale-95 px-3 md:px-4 lg:px-6 py-2 md:py-2.5 lg:py-3 text-[10px] lg:text-[13px] hover:opacity-90"
          >
            <span className="whitespace-nowrap hidden sm:inline">
              Book <span className="hidden lg:inline">Appointment</span>
            </span>
            <span className="sm:hidden">
              <Calendar size={16} />
            </span>
          </button>
          
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center bg-terracotta text-white rounded-full transition-all duration-300 shadow-lg active:scale-95 px-3 md:px-4 lg:px-6 py-2 md:py-2.5 lg:py-3 font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:opacity-90"
            >
              <div className="items-center gap-1.5 whitespace-nowrap hidden sm:flex">
                Logout ({user.name.split(' ')[0]}) <LogIn size={13} className="hidden lg:block" />
              </div>
              <span className="sm:hidden">
                <LogIn size={16} />
              </span>
            </button>
          ) : (
            <button 
              onClick={onLoginClick}
              className="flex items-center justify-center bg-main text-intel-dark rounded-full transition-all duration-300 shadow-lg active:scale-95 px-3 md:px-4 lg:px-6 py-2 md:py-2.5 lg:py-3 font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-white"
            >
              <div className="items-center gap-1.5 whitespace-nowrap hidden sm:flex">
                Login <LogIn size={13} className="hidden lg:block" />
              </div>
              <span className="sm:hidden">
                <LogIn size={16} />
              </span>
            </button>
          )}
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex items-center justify-center text-white/70 w-7 h-7 mx-0.5 shrink-0 hover:text-white"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Animated Wavy Bottom Edge */}
      {!isPill && (
        <div className="absolute left-0 right-0 bottom-[-24px] h-[25px] w-full overflow-hidden pointer-events-none">
          <div 
            className="absolute bottom-0 w-[200%] h-full flex"
            style={{ animation: 'navWave 14s linear infinite' }}
          >
            {/* Tile 1 */}
            <svg className="w-1/2 h-full" preserveAspectRatio="none" viewBox="0 0 1440 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 L0,15 C360,-10 360,40 720,15 C1080,-10 1080,40 1440,15 L1440,0 Z" fill="#1A1A1A"/>
            </svg>
            {/* Tile 2 */}
            <svg className="w-1/2 h-full" preserveAspectRatio="none" viewBox="0 0 1440 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 L0,15 C360,-10 360,40 720,15 C1080,-10 1080,40 1440,15 L1440,0 Z" fill="#1A1A1A"/>
            </svg>
          </div>
        </div>
      )}

      <style>{`
        @keyframes navWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </nav>

    {/* Mobile Menu Overlay */}
    {isMenuOpen && (
      <div className="fixed inset-0 bg-intel-dark z-[110] flex flex-col p-8 animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center">
            <img src="/assets/imgs/logo_full.png" alt="Intel Counselling" className="h-10 w-auto object-contain" />
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col gap-6 overflow-y-auto">
          {navLinks.map((link) => (
             <a 
              key={link.id} 
              href={`#${link.id}`} 
              onClick={(e) => handleNavClick(e, link.id)}
              className="text-3xl font-black text-white serif border-b border-white/5 pb-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-white/40 group-hover:text-white transition-colors">{link.icon}</span>
                {link.label}
              </div>
              <ArrowRight size={20} className="opacity-20" />
            </a>
          ))}
          
          <div className="flex flex-col gap-4 mt-8">
            <button 
              onClick={() => { onBookClick(); setIsMenuOpen(false); }}
              className="w-full py-5 bg-serene-green text-white rounded-2xl font-bold text-base shadow-xl"
            >
              Book Appointment
            </button>
            {user ? (
              <button 
                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                className="w-full py-5 bg-terracotta text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
              >
                Logout ({user.name}) <LogIn size={18} />
              </button>
            ) : (
              <button 
                onClick={() => { onLoginClick?.(); setIsMenuOpen(false); }}
                className="w-full py-5 bg-main text-intel-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
              >
                Login <LogIn size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

export default Navbar;
