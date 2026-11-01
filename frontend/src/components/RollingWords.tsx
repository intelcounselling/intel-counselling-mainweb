import React, { useEffect, useState } from 'react';

interface RollingWordsProps {
  words: string[];
  /** Time each word stays before the next one bounces in. */
  interval?: number;
  className?: string;
  /** a hand-drawn gold underline under the word */
  underline?: boolean;
}

// A word that rolls through a list. Letters drop in one after another with a bounce
// and the old word's letters hop away. All words share one grid cell, so the widest
// word sets the width and the heading never jumps. Screen readers get the whole list
// as plain text; reduced-motion users get the first word, still.
const RollingWords: React.FC<RollingWordsProps> = ({ words, interval = 2800, className = '', underline = false }) => {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      return;
    }
    const timer = setInterval(() => {
      setIndex((i) => {
        setPrevious(i);
        return (i + 1) % words.length;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <>
      <span className={`rw-cell relative inline-grid align-baseline ${className}`} aria-hidden="true">
        {words.map((word, w) => {
          const state = w === index ? 'in' : w === previous ? 'out' : 'off';
          return (
            <span
              key={word}
              className={`rw-word col-start-1 row-start-1 whitespace-nowrap ${state === 'off' ? 'invisible' : ''}`}
            >
              {[...word].map((ch, i) => (
                <span
                  // changing the key on entry restarts the animation each time the word comes round
                  key={`${state}-${i}-${state === 'in' ? index : ''}-${previous}`}
                  className={`rw-letter inline-block ${still ? '' : state === 'in' ? 'rw-in' : state === 'out' ? 'rw-out' : ''}`}
                  style={{ animationDelay: `${i * (state === 'in' ? 55 : 25)}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          );
        })}
        {underline && (
          <svg className="absolute left-0 -bottom-1 w-full h-2.5 text-terracotta pointer-events-none" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2,8 C30,0 60,12 100,6 C140,0 170,11 198,5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </span>
      <span className="sr-only">{words.join(', ')}</span>
    </>
  );
};

export default RollingWords;
