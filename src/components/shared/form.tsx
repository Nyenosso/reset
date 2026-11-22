"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/components/ui/cn";

const useId = React.useId;

export function TextField({ label, value, onChange, placeholder, hint, required, autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; required?: boolean; autoFocus?: boolean }) {
  const id = useId();
  return (
    <Field label={required ? `${label} *` : label} hint={hint} htmlFor={id}>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} autoFocus={autoFocus} />
    </Field>
  );
}

export function AreaField({ label, value, onChange, placeholder, hint, rows = 3, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; rows?: number; required?: boolean }) {
  const id = useId();
  return (
    <Field label={required ? `${label} *` : label} hint={hint} htmlFor={id}>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
    </Field>
  );
}

/** Lijst van korte teksten, één per regel (cues, fouten, voordelen …). */
export function LinesField({ label, value, onChange, placeholder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: string }) {
  const id = useId();
  const joined = value.join("\n");
  const [text, setText] = React.useState(joined);
  const [prev, setPrev] = React.useState(joined);
  if (joined !== prev) {
    // Externe wijziging (bijv. format gekozen): tekstveld bijwerken tijdens render (aanbevolen React-patroon).
    setPrev(joined);
    if (text.split("\n").map((x) => x.trim()).filter(Boolean).join("\n") !== joined) setText(joined);
  }
  return (
    <Field label={label} hint={hint ?? "Eén per regel"} htmlFor={id}>
      <Textarea
        id={id}
        rows={Math.max(2, Math.min(6, value.length + 1))}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean));
        }}
      />
    </Field>
  );
}

export function CsvField({ label, value, onChange, placeholder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: string }) {
  const [text, setText] = React.useState(value.join(", "));
  return (
    <TextField
      label={label}
      hint={hint ?? "Gescheiden door komma’s"}
      placeholder={placeholder}
      value={text}
      onChange={(v) => {
        setText(v);
        onChange(v.split(",").map((x) => x.trim()).filter(Boolean));
      }}
    />
  );
}

export function RangeField({ label, value, onChange, min, max, step = 1, format }: { label: string; value: [number, number]; onChange: (v: [number, number]) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <Stepper label={`${label} minimum`} value={value[0]} min={min} max={value[1]} step={step} format={format} onChange={(v) => onChange([v, value[1]])} />
        <span className="text-faint">tot</span>
        <Stepper label={`${label} maximum`} value={value[1]} min={value[0]} max={max} step={step} format={format} onChange={(v) => onChange([value[0], v])} />
      </div>
    </Field>
  );
}

export function More({ title = "Meer details", children, defaultOpen }: { title?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  return (
    <div className="mt-4 rounded-xl border border-line">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-12 w-full items-center justify-between px-3 text-[15px] font-medium">
        {title}
        <ChevronDown className={cn("size-5 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="flex flex-col gap-4 border-t border-line p-3">{children}</div>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="text-[15px]">{label}</span>
        {hint && <span className="block text-xs text-faint">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-line-strong")}
      >
        <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}
