import React, { useState, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
    };
    img.onerror = () => {
      setError(true);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#e0dbcd]/20 ${wrapperClassName}`} style={{ width: '100%', height: '100%' }}>
      {/* Skeleton / Scaffold Placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-r from-[#ece6d9] via-[#e5dfd1] to-[#ece6d9] animate-pulse">
          <div className="w-10 h-10 rounded-full border-2 border-[#1C3F39]/10 border-t-[#1C3F39] animate-spin opacity-30" />
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#ece6d9] text-[#1C3F39]/40 text-xs">
          Image failed to load
        </div>
      )}

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        loading="lazy"
        {...props}
      />
    </div>
  );
};
