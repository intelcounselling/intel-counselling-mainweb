"use client";

import * as React from "react";

export interface TiltProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum tilt in degrees, towards the pointer. */
  rotationFactor?: number;
  /** Tilt away from the pointer instead of towards it. */
  isReverse?: boolean;
  /** Scale while hovered (1 turns it off). */
  scaleOnHover?: number;
  children?: React.ReactNode;
}

// Tilts its box in 3D towards the pointer and scales up slightly on hover.
// Mouse and pen only: touch has no hover, and reduced-motion users get a still card.
// Styles are written straight to the element so tracking never re-renders React.
export function Tilt({
  rotationFactor = 15,
  isReverse = false,
  scaleOnHover = 1.04,
  className,
  style,
  children,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ...props
}: TiltProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const still = React.useRef(false);

  React.useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const active = (e: React.PointerEvent) => !still.current && e.pointerType !== "touch";

  const handleEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e);
    const el = ref.current;
    if (!el || !active(e)) return;
    el.style.scale = String(scaleOnHover);
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || !active(e)) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const y = (e.clientY - r.top) / r.height - 0.5;
    const dir = isReverse ? -1 : 1;
    el.style.transition = "transform 120ms ease-out, scale 300ms ease-out, box-shadow 300ms ease-out";
    el.style.transform = `perspective(1000px) rotateX(${(-y * rotationFactor * 2 * dir).toFixed(2)}deg) rotateY(${(x * rotationFactor * 2 * dir).toFixed(2)}deg)`;
  };

  const handleLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), scale 400ms ease-out, box-shadow 300ms ease-out";
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    el.style.scale = "1";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...props}
    >
      {children}
    </div>
  );
}
