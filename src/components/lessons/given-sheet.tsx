"use client";

import * as React from "react";
import type { Evaluation, Lesson } from "@/lib/domain/types";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { AreaField, Toggle } from "@/components/shared/form";
import { cn } from "@/components/ui/cn";

const today = () => new Date().toISOString().slice(0, 10);

/** Compacte evaluatie na het geven van een les. Alle velden zijn optioneel. */
export function GivenSheet({ lesson, open, onOpenChange }: { lesson: Lesson; open: boolean; onOpenChange: (v: boolean) => void }) {
  const mark = useStore((s) => s.markLessonGiven);
  const [ev, setEv] = React.useState<Evaluation>(() => ({ date: lesson.evaluation?.date ?? lesson.date ?? today(), participants: lesson.evaluation?.participants ?? lesson.participants, reuse: lesson.evaluation?.reuse ?? true, ...lesson.evaluation }));
  const set = (p: Partial<Evaluation>) => setEv((v) => ({ ...v, ...p }));
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Markeer als gegeven"
      description={lesson.title}
      footer={
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            mark(lesson.id, ev);
            toast("Les gemarkeerd als gegeven");
            onOpenChange(false);
          }}
          data-testid="save-given"
        >
          Opslaan
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Datum">
            <Input type="date" value={ev.date ?? ""} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Deelnemers">
            <Stepper label="Deelnemers" value={ev.participants ?? lesson.participants} min={0} max={80} onChange={(participants) => set({ participants })} />
          </Field>
        </div>
        <Field label="Hoe ging het?">
          <div className="flex gap-1.5" role="radiogroup" aria-label="Beoordeling">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={ev.rating === n} onClick={() => set({ rating: n })} className={cn("grid size-11 place-items-center rounded-lg border text-[15px] font-semibold", ev.rating === n ? "border-ink bg-ink text-white" : "border-line bg-surface")}>
                {n}
              </button>
            ))}
          </div>
        </Field>
        <AreaField label="Korte evaluatie" value={ev.summary ?? ""} onChange={(summary) => set({ summary })} rows={2} />
        <AreaField label="Wat werkte goed?" value={ev.wentWell ?? ""} onChange={(wentWell) => set({ wentWell })} rows={2} />
        <AreaField label="Wat zou ik verbeteren?" value={ev.improve ?? ""} onChange={(improve) => set({ improve })} rows={2} />
        <AreaField label="Scores (bv. teamstand, PR’s)" value={ev.scores ?? ""} onChange={(scores) => set({ scores })} rows={2} />
        <Toggle label="Opnieuw gebruiken" checked={ev.reuse ?? true} onChange={(reuse) => set({ reuse })} />
      </div>
    </Sheet>
  );
}
