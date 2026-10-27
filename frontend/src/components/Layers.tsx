import React from 'react';

// Plain page sections. These used to be sticky "stacking" layers that faded
// and scaled while scrolling; normal document flow reads calmer and keeps
// anchor links (#founders, #services) landing where expected.
export const Layer: React.FC<{
  children: React.ReactNode;
  id?: string;
  className?: string;
  zIndex: number;
}> = ({ children, id, className = '', zIndex }) => (
  <section id={id} className={`relative scroll-mt-20 ${className}`} style={{ zIndex }}>
    {children}
  </section>
);

export const ApproachLayer: React.FC<{
  children: React.ReactNode;
  id?: string;
  zIndex: number;
}> = ({ children, id, zIndex }) => (
  <section id={id} className="relative bg-[#1F1E1B] pt-16 pb-12 md:pt-20 md:pb-16 scroll-mt-20 overflow-hidden" style={{ zIndex }}>
    {children}
  </section>
);
