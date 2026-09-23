/** Minimal classnames joiner. No `clsx`/`tailwind-merge` dependency needed for this scale (YAGNI). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
