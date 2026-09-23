import { ReactNode } from "react";

/** One shared empty state — every list screen uses this instead of hand-rolling its own. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-foreground/70">{description}</p>}
      {action}
    </div>
  );
}
