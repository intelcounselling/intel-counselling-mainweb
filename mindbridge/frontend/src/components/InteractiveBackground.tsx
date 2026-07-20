
import React, { useEffect, useRef } from 'react';

const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothedMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    // Initialize mouse position to center
    mouseRef.current = { x: width / 2, y: height / 2 };
    smoothedMouseRef.current = { x: width / 2, y: height / 2 };

    const render = () => {
      // Very smooth interpolation for a premium feel
      smoothedMouseRef.current.x += (mouseRef.current.x - smoothedMouseRef.current.x) * 0.1;
      smoothedMouseRef.current.y += (mouseRef.current.y - smoothedMouseRef.current.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // Base background color (Cream)
      ctx.fillStyle = '#F7EBD3';
      ctx.fillRect(0, 0, width, height);

      const viewDim = Math.max(width, height);
      const time = performance.now() * 0.001;

      // Layer 1: Global Soft Sage Drift (Slow moving ambient light)
      const blob1X = width * 0.5 + Math.cos(time * 0.3) * (width * 0.2);
      const blob1Y = height * 0.5 + Math.sin(time * 0.2) * (height * 0.2);
      
      const ambientSage = ctx.createRadialGradient(blob1X, blob1Y, 0, blob1X, blob1Y, viewDim * 0.8);
      ambientSage.addColorStop(0, 'rgba(120, 160, 131, 0.08)');
      ambientSage.addColorStop(1, 'rgba(247, 235, 211, 0)');
      ctx.fillStyle = ambientSage;
      ctx.fillRect(0, 0, width, height);

      // Layer 2: The Main Interactive Spotlight (Follows Cursor)
      // This mimics the "Services" effect but scales globally
      const spotlightX = smoothedMouseRef.current.x;
      const spotlightY = smoothedMouseRef.current.y;

      const cursorSpotlight = ctx.createRadialGradient(
        spotlightX,
        spotlightY,
        0,
        spotlightX,
        spotlightY,
        800 // Large spread
      );
      cursorSpotlight.addColorStop(0, 'rgba(120, 160, 131, 0.12)');
      cursorSpotlight.addColorStop(1, 'rgba(247, 235, 211, 0)');
      
      ctx.fillStyle = cursorSpotlight;
      ctx.fillRect(0, 0, width, height);

      // Layer 3: Brighter Center Glow (Cursor Highlight)
      const cursorGlow = ctx.createRadialGradient(
        spotlightX,
        spotlightY,
        0,
        spotlightX,
        spotlightY,
        400 // Tighter spread
      );
      cursorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      cursorGlow.addColorStop(1, 'rgba(247, 235, 211, 0)');
      
      ctx.fillStyle = cursorGlow;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] block w-full h-full"
    />
  );
};

export default InteractiveBackground;
