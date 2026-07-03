import type { ReactNode } from "react";

export type BadgeTone =
  | "good"
  | "warn"
  | "serious"
  | "crit"
  | "neutral"
  | "accent";

const TONE_CLASSES: Record<BadgeTone, string> = {
  good: "bg-good-soft text-good-deep",
  warn: "bg-warn-soft text-warn",
  serious: "bg-serious-soft text-serious",
  crit: "bg-crit-soft text-crit",
  neutral: "bg-wash text-sub",
  accent: "bg-accent-soft text-accent",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
