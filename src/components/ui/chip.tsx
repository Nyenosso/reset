import * as React from "react";
import { cn } from "./cn";

export function Chip({ selected, onClick, children, className, size = "md" }: { selected?: boolean; onClick?: () => void; children: React.ReactNode; className?: string; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-medium transition-colors",
        size === "md" ? "h-9 px-3 text-sm" : "h-8 px-2.5 text-[13px]",
        selected ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-line-strong",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "accent" | "ok" | "warn" | "danger"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium",
        tone === "neutral" && "bg-subtle text-muted",
        tone === "accent" && "bg-accent-soft text-accent-strong",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "danger" && "bg-danger-soft text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Kies één of meer opties uit een vocabulaire. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = true,
  size = "md",
}: {
  options: readonly { id: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <Chip key={o.id} size={size} selected={on} onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o.id) : [...value, o.id]) : on ? [] : [o.id])}>
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
