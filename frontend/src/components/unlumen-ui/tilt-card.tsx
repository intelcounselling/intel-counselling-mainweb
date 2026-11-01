"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { ClippedCircle } from "@/components/unlumen-ui/primitives/clipped-circle";
import { Tilt, type TiltProps } from "@/components/unlumen-ui/primitives/tilt";

export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  /** left half of the split badge pill; shown as a simple pill if `badgeLabel` is omitted */
  price?: string;
  /** right half of the split pill, coloured by `badgeVariant` */
  badgeLabel?: string;
  badgeVariant?: "success" | "warning";
  imageSrc?: string;
  imageAlt?: string;
  /** wraps the card in a plain `<a>` tag */
  href?: string;
  children?: React.ReactNode;
  tiltProps?: Omit<TiltProps, "children" | "className">;

  // Added for this site ------------------------------------------------------
  /** a small icon tile above the title */
  icon?: React.ReactNode;
  /** "dark" for cards on charcoal sections, "charcoal" for solid dark cards on cream ones, "light" for white cards */
  tone?: "light" | "dark" | "charcoal";
  /** colour of the circle that grows from the cursor on hover */
  circleClassName?: string;
  circleSize?: number;
  /** corner radius class (kept as a prop so it never fights the default) */
  rounded?: string;
  /** heading level for the title */
  titleAs?: "h2" | "h3";
  /** padding of the content area (replaces the compact default) */
  contentClassName?: string;
}

const BADGE_LABEL_CLASSES: Record<
  NonNullable<TiltCardProps["badgeVariant"]>,
  string
> = {
  success: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/20 text-amber-700",
};

// Our palette instead of shadcn's background / border / secondary tokens.
// On "dark" the text turns dark while the pastel circle fills the card.
const TONES = {
  light: {
    card: "bg-white border-black/10",
    title: "text-intel-dark",
    description: "text-intel-dark/50",
    pill: "bg-black/5 text-intel-dark",
  },
  dark: {
    card: "bg-white/[0.04] border-white/10",
    title: "text-white group-data-[circle=on]:text-intel-dark",
    description: "text-white/60 group-data-[circle=on]:text-intel-dark/70",
    pill: "bg-white/10 text-white group-data-[circle=on]:bg-black/10 group-data-[circle=on]:text-intel-dark",
  },
  charcoal: {
    card: "bg-[#1F1E1B] border-white/10 shadow-[0_12px_30px_rgba(26,26,26,0.18)]",
    title: "text-[#F4EFE6] group-data-[circle=on]:text-intel-dark",
    description: "text-white/60 group-data-[circle=on]:text-intel-dark/70",
    pill: "bg-white/10 text-white group-data-[circle=on]:bg-black/10 group-data-[circle=on]:text-intel-dark",
  },
} as const;

export function TiltCard({
  title,
  description,
  price,
  badgeLabel,
  badgeVariant = "success",
  imageSrc,
  imageAlt = "",
  href,
  children,
  tiltProps,
  className,
  icon,
  tone = "light",
  circleClassName = "bg-white",
  circleSize = 800,
  rounded = "rounded-lg",
  titleAs: Title = "h2",
  contentClassName = "px-4 sm:px-6 py-4 sm:py-5",
  ...props
}: TiltCardProps) {
  const t = TONES[tone];

  const inner = (
    <Tilt
      rotationFactor={11}
      {...tiltProps}
      className={cn(
        "relative group overflow-hidden border",
        t.card,
        rounded,
        "flex flex-col gap-4",
        "min-h-48 sm:min-h-52 md:min-h-56 w-full h-full",
        "hover:shadow-lg transition-all duration-400 ease-out",
        className,
      )}
    >
      <div className={cn("relative z-10 flex flex-row transition-all duration-200 justify-between", contentClassName)}>
        <div className="flex flex-col gap-1 flex-1 mr-2">
          {icon && <div className="mb-3">{icon}</div>}
          <Title className={cn("text-lg tracking-tight leading-tight font-medium transition-colors duration-300", t.title)}>
            {title}
          </Title>
          {description && (
            <p className={cn("text-sm transition-colors duration-300", t.description)}>{description}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>

        {price && badgeLabel ? (
          <div className="inline-flex h-fit items-center text-sm whitespace-nowrap shrink-0">
            <span className={cn("rounded-l-full h-fit py-1 px-2 font-medium transition-colors duration-300", t.pill)}>
              {price}
            </span>
            <span
              className={cn(
                "rounded-r-full text-sm h-fit py-1 px-2 font-medium",
                BADGE_LABEL_CLASSES[badgeVariant],
              )}
            >
              {badgeLabel}
            </span>
          </div>
        ) : price ? (
          <span className={cn("h-fit rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-300", t.pill)}>
            {price}
          </span>
        ) : null}
      </div>

      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          width={288}
          height={224}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute z-10 top-[6.75rem] w-72 -right-10",
            "rotate-[-5deg] border-black/10 border rounded-md",
            "transition-transform duration-300 ease-out",
            "group-hover:-rotate-3 group-hover:-translate-y-1 group-hover:-translate-x-0.5",
          )}
        />
      )}

      <ClippedCircle circleClassName={circleClassName} circleSize={circleSize} />
    </Tilt>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block cursor-pointer"
        {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {inner}
      </a>
    );
  }

  return <div className="h-full" {...props}>{inner}</div>;
}
