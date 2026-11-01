"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface ClippedCircleProps {
  /** Colour of the circle, e.g. "bg-white". */
  circleClassName?: string;
  /** Diameter in px; big enough to cover the card from any entry point. */
  circleSize?: number;
  className?: string;
}

// A circle that grows from the pointer when the parent is hovered and shrinks away
// when it leaves. It is clipped to the parent's rounded box and sits behind the
// content (z-0), so give the content `relative z-10`. The parent must be `relative`.
// While the circle is showing it sets data-circle="on" on the parent (slightly delayed), so text colours
// can follow it with `group-data-[circle=on]:` (unlike :hover, this ignores touch).
export function ClippedCircle({
  circleClassName = "bg-white",
  circleSize = 600,
  className,
}: ClippedCircleProps) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const circle = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const host = wrap.current?.parentElement;
    const dot = circle.current;
    if (!host || !dot) return;

    const place = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      dot.style.left = `${e.clientX - r.left}px`;
      dot.style.top = `${e.clientY - r.top}px`;
    };
    // The text colour flips a beat after the circle starts growing (and a beat after it
    // starts shrinking), so text is never dark on dark or light on pastel mid-animation.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      place(e);
      dot.style.transform = "translate(-50%, -50%) scale(1)";
      clearTimeout(timer);
      timer = setTimeout(() => { host.dataset.circle = "on"; }, 200);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "touch") place(e);
    };
    const leave = () => {
      dot.style.transform = "translate(-50%, -50%) scale(0)";
      clearTimeout(timer);
      timer = setTimeout(() => { delete host.dataset.circle; }, 250);
    };

    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      clearTimeout(timer);
      delete host.dataset.circle;
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      style={{ borderRadius: "inherit" }}
    >
      <span
        ref={circle}
        className={cn("absolute rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none", circleClassName)}
        style={{
          width: circleSize,
          height: circleSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) scale(0)",
        }}
      />
    </div>
  );
}
