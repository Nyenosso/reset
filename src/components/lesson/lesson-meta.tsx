"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { GOALS, ORGANIZATIONS, statusLabel, type Organization } from "@/lib/domain/vocab";
import { useStore } from "@/lib/store";
import { Field, Input, Select } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { ChipGroup } from "@/components/ui/chip";
import { AreaField } from "@/components/shared/form";

function formatDate(d?: string) {
  if (!d) return "Geen datum";
  const date = new Date(`${d}T12:00:00`);
  return date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

/** Meegroeiend titelveld (lange titels lopen door op een volgende regel). */
function AutoTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (e.target as HTMLTextAreaElement).blur())}
      onBlur={(e) => !e.target.value.trim() && onChange("Naamloze les")}
      aria-label="Titel van de les"
      className="block w-full resize-none overflow-hidden bg-transparent text-[22px] font-semibold leading-tight tracking-tight outline-none placeholder:text-faint"
      placeholder="Titel van de les"
      data-testid="lesson-title"
    />
  );
}

export function LessonMeta({ lesson }: { lesson: Lesson }) {
  const update = useStore((s) => s.updateLesson);
  const [edit, setEdit] = React.useState(false);
  const set = (p: Partial<Lesson>) => update(lesson.id, (l) => ({ ...l, ...p }));
  return (
    <div>
      <AutoTitle value={lesson.title} onChange={(title) => set({ title })} />
      <button type="button" onClick={() => setEdit(!edit)} aria-expanded={edit} className="mt-0.5 flex min-h-9 items-center gap-1.5 text-left text-[14px] text-muted">
        <span>
          {formatDate(lesson.date)} · {lesson.audience || "Doelgroep"} · {lesson.participants} deelnemers · {Math.round(lesson.targetSec / 60)} min · {statusLabel(lesson.status)}
        </span>
        <Pencil className="size-3.5 shrink-0" />
      </button>
      {edit && (
        <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-3">
          <Field label="Datum">
            <Input type="date" value={lesson.date ?? ""} onChange={(e) => set({ date: e.target.value || undefined, status: e.target.value && lesson.status === "concept" ? "gepland" : lesson.status })} />
          </Field>
          <Field label="Doelgroep">
            <Input value={lesson.audience} onChange={(e) => set({ audience: e.target.value })} />
          </Field>
          <Field label="Deelnemers">
            <Stepper label="Deelnemers" value={lesson.participants} min={1} max={60} onChange={(participants) => set({ participants })} />
          </Field>
          <Field label="Lesduur">
            <Stepper label="Lesduur" value={Math.round(lesson.targetSec / 60)} min={10} max={180} step={5} format={(v) => `${v} min`} onChange={(v) => set({ targetSec: v * 60 })} />
          </Field>
          <Field label="Standaard organisatie" className="col-span-2">
            <Select value={lesson.organization} onChange={(e) => set({ organization: e.target.value as Organization })}>
              {ORGANIZATIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trainingsdoelen" className="col-span-2">
            <ChipGroup size="sm" options={GOALS} value={lesson.goals} onChange={(goals) => set({ goals })} />
          </Field>
          <div className="col-span-2">
            <AreaField label="Notities bij de les" value={lesson.notes} onChange={(notes) => set({ notes })} rows={2} />
          </div>
        </div>
      )}
    </div>
  );
}
