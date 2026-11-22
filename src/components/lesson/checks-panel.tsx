"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown, Info, CheckCircle2 } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { checkLesson } from "@/lib/data/checks";
import { useLibrary, useStore } from "@/lib/store";
import { cn } from "@/components/ui/cn";

/** Subtiele, adviserende lescontrole. */
export function ChecksPanel({ lesson, onFocusBlock }: { lesson: Lesson; onFocusBlock?: (id: string) => void }) {
  const lib = useLibrary();
  const prefs = useStore((s) => s.data.prefs);
  const results = React.useMemo(() => checkLesson(lesson, lib, prefs), [lesson, lib, prefs]);
  const [open, setOpen] = React.useState(false);
  const warnings = results.filter((r) => r.level === "warning").length;
  if (!lesson.blocks.length) return null;
  if (!results.length)
    return (
      <p className="flex items-center gap-1.5 px-1 text-[13px] text-ok">
        <CheckCircle2 className="size-4" /> Geen aandachtspunten
      </p>
    );
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-11 w-full items-center gap-2 px-3 text-left text-[14px]" data-testid="checks-toggle">
        {warnings ? <AlertTriangle className="size-4 text-warn" /> : <Info className="size-4 text-faint" />}
        <span className="flex-1">
          {results.length} {results.length === 1 ? "aandachtspunt" : "aandachtspunten"}
          {warnings > 0 && <span className="text-warn"> · {warnings} {warnings === 1 ? "waarschuwing" : "waarschuwingen"}</span>}
        </span>
        <ChevronDown className={cn("size-4 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="border-t border-line px-3 py-2" data-testid="checks-list">
          {results.map((r) => (
            <li key={r.id} className="flex gap-2 py-1.5 text-[14px]">
              {r.level === "warning" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" /> : <Info className="mt-0.5 size-4 shrink-0 text-faint" />}
              <span className="flex-1">
                {r.message}
                {r.blockIds?.[0] && onFocusBlock && (
                  <button type="button" className="ml-1 font-medium text-accent" onClick={() => onFocusBlock(r.blockIds![0])}>
                    Bekijk
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
