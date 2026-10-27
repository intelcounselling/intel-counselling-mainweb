import React from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

// A plain card container. It used to tilt in 3D and paint a cursor-following
// glow; for a clinic site, a still card reads as more trustworthy.
const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '' }) => (
  <div className={`relative overflow-hidden border border-white/10 p-8 group ${className}`}>
    {children}
  </div>
);

export default SpotlightCard;
