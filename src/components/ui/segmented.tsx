import * as React from "react";
import { cn } from "./cn";

export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto rounded-xl bg-subtle p-1 no-scrollbar", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex h-9 flex-1 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
            value === o.id ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="text-xs text-faint tabular">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
