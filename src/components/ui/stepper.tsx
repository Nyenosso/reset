"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "./cn";

export function Stepper({ value, onChange, min = 0, max = 9999, step = 1, format, label, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; format?: (v: number) => string; label: string; className?: string }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className={cn("inline-flex h-11 items-center rounded-lg border border-line bg-surface", className)} role="group" aria-label={label}>
      <button type="button" className="grid h-full w-10 place-items-center text-muted hover:text-ink disabled:opacity-30" onClick={() => onChange(clamp(value - step))} disabled={value <= min} aria-label={`${label} verlagen`}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-[3.25rem] text-center text-[15px] font-medium tabular" aria-live="polite">
        {format ? format(value) : value}
      </span>
      <button type="button" className="grid h-full w-10 place-items-center text-muted hover:text-ink disabled:opacity-30" onClick={() => onChange(clamp(value + step))} disabled={value >= max} aria-label={`${label} verhogen`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
