import React, { useRef, useState, useEffect } from 'react';

export const Layer: React.FC<{
  children: React.ReactNode;
  id?: string;
  className?: string;
  zIndex: number;
  noFade?: boolean;
  scrollAnimateIn?: boolean;
}> = ({ children, id, className = '', zIndex, noFade = false, scrollAnimateIn = false }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top <= 0) {
        if (noFade) {
          setOpacity(1);
          setScale(1);
          return;
        }
        const exitProgress = Math.min(Math.abs(rect.top) / windowHeight, 1);
        const fadeThreshold = 0.90; 
        if (exitProgress > fadeThreshold) {
          const normalizedFade = (exitProgress - fadeThreshold) / (1 - fadeThreshold);
          setOpacity(1 - normalizedFade); 
          setScale(1 - normalizedFade * 0.04);
        } else {
          setOpacity(1);
          setScale(1);
        }
      } 
      else if (scrollAnimateIn && rect.top < windowHeight) {
        const entryProgress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.6)));
        setOpacity(entryProgress);
        setScale(0.95 + (entryProgress * 0.05));
      }
      else if (scrollAnimateIn && rect.top >= windowHeight) {
        setOpacity(0);
        setScale(0.95);
      }
      else {
        setOpacity(1);
        setScale(1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [noFade, scrollAnimateIn]);

  return (
    <section 
      ref={sectionRef}
      id={id} 
      className={`stacking-section scroll-mt-20 md:scroll-mt-28 ${className}`}
      style={{ 
        zIndex,
        opacity: noFade ? 1 : opacity,
        transform: noFade ? 'none' : `scale(${scale})`
      }}
    >
      {children}
    </section>
  );
};

export const ApproachLayer: React.FC<{
  children: React.ReactNode;
  id?: string;
  zIndex: number;
}> = ({ children, id, zIndex }) => {
  return (
    <section 
      id={id} 
      className="relative z-10 bg-[#1F1E1B] py-16 md:py-32 scroll-mt-20 overflow-hidden"
      style={{ zIndex }}
    >
      {children}
    </section>
  );
};
