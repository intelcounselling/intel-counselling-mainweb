// Joins class names, skipping anything falsy. (No tailwind-merge here: callers pass
// non-conflicting classes, and TiltCard exposes props for the ones that need overriding.)
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
