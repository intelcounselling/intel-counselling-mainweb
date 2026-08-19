import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ClickSpark from './components/ClickSpark';
import InteractiveBackground from './components/InteractiveBackground';
import AuthModal from './components/AuthModal';

// Pages (lazy-loaded for route-level code splitting)
const Home = lazy(() => import('./pages/Home'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const AssessmentTestPage = lazy(() => import('./pages/AssessmentTestPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CareerGuidancePage = lazy(() => import('./pages/CareerGuidancePage'));

// Minimal centered spinner shown briefly while a route chunk loads
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-terracotta/30 border-t-terracotta animate-spin" aria-label="Loading" />
  </div>
);

// A helper component to handle scroll restoration and hash navigation
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const AppContent: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Added useNavigate

  useEffect(() => {
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const sparkRadius = isMobile ? 10 : 20;
  const sparkSize = isMobile ? 6 : 12;

  const isHome = location.pathname === '/';

  return (
    <div className={`relative min-h-screen selection:bg-terracotta/40 selection:text-[#2A2825] overflow-x-hidden ${isHome ? 'bg-[#F7EBD3]' : 'bg-[#F7EBD3]'}`}>
      <ScrollToTop />
      <InteractiveBackground />
      
      <ClickSpark 
        sparkColor="#2A2825" 
        sparkCount={isMobile ? 6 : 10} 
        sparkSize={sparkSize} 
        sparkRadius={sparkRadius} 
        duration={500} 
      />
      
      <Navbar 
        onBookClick={() => navigate('/services/personal')}
        onLoginClick={() => window.open('https://intel-counselling-frontend.vercel.app', '_blank')}
        forcePill={!isHome}
      />
      
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services/:serviceId" element={<ServicePage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/:testId" element={<AssessmentTestPage />} />
          <Route path="/career-assessment" element={<CareerGuidancePage />} />
          <Route path="/booking" element={<BookingPage />} />
        </Routes>
      </Suspense>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      <section className="relative z-40 bg-[#1F1E1B]">
        <Footer />
      </section>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;