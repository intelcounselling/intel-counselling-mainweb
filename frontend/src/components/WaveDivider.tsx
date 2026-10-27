import React from 'react';

// A soft, slowly drifting wave between two sections: `from` is the colour of
// the section above, `to` the colour of the section below.
const PATH = 'M0,40 C240,10 480,70 720,40 C960,10 1200,70 1440,40 L1440,80 L0,80 Z';

const WaveDivider: React.FC<{ from: string; to: string; flip?: boolean }> = ({ from, to, flip }) => (
  <div
    className="relative z-[16] -my-px h-[48px] md:h-[72px] overflow-x-clip leading-[0]"
    style={{ background: from, transform: flip ? 'scaleX(-1)' : undefined }}
    aria-hidden="true"
  >
    {/* Extends 2px past the bottom so the moving layer's anti-aliased edge
        sits over the next section (same colour) instead of showing a seam */}
    <div className="wave-drift absolute top-0 -bottom-[2px] left-0 w-[200%] flex">
      {[0, 1].map((i) => (
        <svg key={i} className={`w-1/2 h-full shrink-0 ${i ? '-ml-px' : ''}`} viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d={PATH} fill={to} />
        </svg>
      ))}
    </div>
    <style>{`
      @keyframes waveDrift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .wave-drift { animation: waveDrift 22s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .wave-drift { animation: none; } }
    `}</style>
  </div>
);

export default WaveDivider;
