import React, { useRef, useEffect, useCallback } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = '#78A083',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<any[]>([]);

  const createSparks = useCallback((x: number, y: number) => {
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      sparksRef.current.push({
        x,
        y,
        angle,
        distance: 0,
        opacity: 1,
        startTime: performance.now(),
      });
    }
  }, [sparkCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleClick = (e: MouseEvent) => {
      createSparks(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        createSparks(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = time - spark.startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) return false;

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentDistance = sparkRadius * easeOut;
        const currentX = spark.x + Math.cos(spark.angle) * currentDistance;
        const currentY = spark.y + Math.sin(spark.angle) * currentDistance;
        
        const opacity = 1 - progress;
        const size = sparkSize * (1 - progress);

        ctx.beginPath();
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = opacity;
        
        // Draw a small line representing the spark
        const lineEndX = currentX + Math.cos(spark.angle) * size;
        const lineEndY = currentY + Math.sin(spark.angle) * size;
        
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.stroke();

        return true;
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleTouchStart);
    handleResize();
    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
      cancelAnimationFrame(animationId);
    };
  }, [createSparks, sparkColor, sparkSize, sparkRadius, duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};

export default ClickSpark;