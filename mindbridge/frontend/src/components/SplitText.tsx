
import React, { useEffect, useState, useRef } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationDelay?: number;
}

const SplitText: React.FC<SplitTextProps> = ({ text, className = "", delay = 0, animationDelay = 80 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const currentRef = containerRef.current;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { 
      threshold: 0.1
    });

    observer.observe(currentRef);

    const rect = currentRef.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`${className} flex flex-wrap`}>
      {text.split(' ').map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block overflow-hidden mr-[0.25em] py-[0.15em]">
          <span 
            className="inline-block transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{ 
              transform: isVisible ? 'translateY(0)' : 'translateY(110%)',
              opacity: isVisible ? 1 : 0,
              transitionDelay: isVisible ? `${delay + (wordIdx * animationDelay)}ms` : '0ms',
              willChange: 'transform, opacity'
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </div>
  );
};

export default SplitText;
