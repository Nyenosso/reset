"use client";

import type { Lesson } from "@/lib/domain/types";
import { formatClock } from "@/lib/time/format";
import { lessonTotals } from "@/lib/time/structure";
import { cn } from "@/components/ui/cn";

/** Gepland / doel / resterend of overschrijding, met voortgangsbalk. */
export function TimeBar({ lesson, compact }: { lesson: Lesson; compact?: boolean }) {
  const t = lessonTotals(lesson);
  const over = t.over > 0;
  const pct = t.target > 0 ? Math.min(100, (t.planned / t.target) * 100) : 0;
  return (
    <div className={cn("rounded-xl border border-line bg-surface px-3", compact ? "py-2" : "py-2.5")} data-testid="time-bar">
      <div className="flex items-baseline gap-4 text-[14px] tabular">
        <span>
          <span className="text-muted">Gepland </span>
          <span className="font-semibold" data-testid="time-planned">{formatClock(t.planned)}</span>
        </span>
        <span>
          <span className="text-muted">Doel </span>
          <span className="font-semibold">{formatClock(t.target)}</span>
        </span>
        <span className={cn("ml-auto font-semibold", over ? "text-danger" : t.remaining === 0 ? "text-ok" : "text-ink")} data-testid="time-remaining">
          {over ? `+${formatClock(t.over)} te lang` : t.remaining === 0 ? "Precies op tijd" : `${formatClock(t.remaining)} over`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={t.target} aria-valuenow={t.planned} aria-label="Geplande lestijd">
        <div className={cn("h-full rounded-full transition-[width]", over ? "bg-danger" : t.remaining === 0 ? "bg-ok" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
