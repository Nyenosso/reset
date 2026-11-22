"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import type { Exercise, Format, LessonTemplate, TrainingBlock } from "@/lib/domain/types";
import {
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FORMAT_SECTIONS,
  GLOVE_FITS,
  GOALS,
  MUSCLES,
  ORGANIZATIONS,
  PATTERNS,
  PHASES,
  type ExerciseCategory,
  type FormatSection,
  type GloveFit,
  type Goal,
  type Level,
  type Pattern,
  type Phase,
} from "@/lib/domain/vocab";
import { CATEGORY_GOALS, CATEGORY_PHASES } from "@/data/seed/exercises";
import { partnerAB } from "@/lib/time/presets";
import { describeStructure, describeWorkRest, structureSeconds } from "@/lib/time/structure";
import { emptyBlock } from "@/lib/data/lesson-ops";
import { newId, nowIso } from "@/lib/utils/id";
import { useLibrary, useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ChipGroup, Tag } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";
import { AreaField, CsvField, LinesField, More, RangeField, TextField, Toggle } from "@/components/shared/form";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import { StructureEditor } from "@/components/lesson/structure-editor";
import { BlockForm } from "@/components/lesson/block-form";

const LEVELS = [
  { id: "1", label: "Basis" },
  { id: "2", label: "Gemiddeld" },
  { id: "3", label: "Gevorderd" },
];

function EditorSheet({ open, onOpenChange, title, onSave, children, canSave }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; onSave: () => void; children: React.ReactNode; canSave: boolean }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button variant="primary" onClick={onSave} disabled={!canSave} data-testid="editor-save">
            Opslaan
          </Button>
        </div>
      }
    >
      <form
        className="flex flex-col gap-4 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave();
        }}
      >
        {children}
      </form>
    </Sheet>
  );
}

// ——— Oefening ———
export function newExercise(): Exercise {
  const now = nowIso();
  return {
    kind: "exercise", id: newId("ex"), builtin: false, origin: "eigen", name: "", description: "", instructions: "",
    category: "stoten", categories: ["stoten"], tags: [], goals: [], musclesPrimary: [], musclesSecondary: [], pattern: "stoot",
    equipment: ["bokszak"], gloves: "aan", durationSec: [20, 40], rpe: [4, 6], difficulty: 1, phases: [], organization: ["tweetallen", "individueel"],
    cues: [], mistakes: [], createdAt: now, updatedAt: now,
  };
}

export function ExerciseEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial: Exercise }) {
  const [x, setX] = React.useState(initial);
  const save = useStore((s) => s.saveItem);
  const set = (p: Partial<Exercise>) => setX((v) => ({ ...v, ...p }));
  const canSave = x.name.trim().length > 0 && x.description.trim().length > 0;
  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial.name ? `${initial.name} bewerken` : "Nieuwe oefening"}
      canSave={canSave}
      onSave={() => {
        const categories = Array.from(new Set([x.category, ...x.categories]));
        const final: Exercise = {
          ...x,
          name: x.name.trim(),
          categories,
          phases: x.phases.length ? x.phases : CATEGORY_PHASES[x.category],
          goals: x.goals.length ? x.goals : CATEGORY_GOALS[x.category],
          instructions: x.instructions.trim() || x.description.trim(),
        };
        save(final);
        toast(initial.builtin ? "Aanpassing opgeslagen (origineel blijft herstelbaar)" : "Oefening opgeslagen");
        onOpenChange(false);
      }}
    >
      <TextField label="Naam" required value={x.name} onChange={(name) => set({ name })} autoFocus={!initial.name} />
      <Field label="Categorie *">
        <Select value={x.category} onChange={(e) => set({ category: e.target.value as ExerciseCategory })} aria-label="Categorie">
          {EXERCISE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <AreaField label="Korte omschrijving" required value={x.description} onChange={(description) => set({ description })} rows={2} />
      <More defaultOpen={Boolean(initial.name)}>
        <AreaField label="Uitvoering" value={x.instructions} onChange={(instructions) => set({ instructions })} rows={3} />
        <Field label="Ook in categorieën">
          <ChipGroup size="sm" options={EXERCISE_CATEGORIES} value={x.categories} onChange={(categories) => set({ categories })} />
        </Field>
        <Field label="Lesfasen">
          <ChipGroup size="sm" options={PHASES} value={x.phases} onChange={(phases) => set({ phases })} />
        </Field>
        <Field label="Trainingsdoelen">
          <ChipGroup size="sm" options={GOALS} value={x.goals} onChange={(goals) => set({ goals })} />
        </Field>
        <Field label="Primaire spiergroepen">
          <ChipGroup size="sm" options={MUSCLES} value={x.musclesPrimary} onChange={(musclesPrimary) => set({ musclesPrimary })} />
        </Field>
        <Field label="Secundaire spiergroepen">
          <ChipGroup size="sm" options={MUSCLES} value={x.musclesSecondary} onChange={(musclesSecondary) => set({ musclesSecondary })} />
        </Field>
        <Field label="Bewegingspatroon">
          <Select value={x.pattern} onChange={(e) => set({ pattern: e.target.value as Pattern })} aria-label="Bewegingspatroon">
            {PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Materiaal (één ervan volstaat)">
          <ChipGroup size="sm" options={EQUIPMENT} value={x.equipment} onChange={(equipment) => set({ equipment })} />
        </Field>
        <Field label="Handschoenen">
          <Segmented label="Handschoenen" options={GLOVE_FITS.map((g) => ({ id: g.id, label: g.id === "beide" ? "Beide" : g.id === "aan" ? "Aan" : "Uit" }))} value={x.gloves} onChange={(gloves) => set({ gloves: gloves as GloveFit })} />
        </Field>
        <RangeField label="Voorkeursduur (sec)" value={x.durationSec} min={5} max={600} step={5} onChange={(durationSec) => set({ durationSec })} />
        <TextField label="Alternatief aantal herhalingen" value={x.reps ?? ""} onChange={(reps) => set({ reps: reps || undefined })} placeholder="bv. 10–15" />
        <RangeField label="Intensiteit (RPE)" value={x.rpe} min={1} max={10} onChange={(rpe) => set({ rpe })} />
        <Field label="Technische moeilijkheid">
          <Segmented label="Moeilijkheid" options={LEVELS} value={String(x.difficulty)} onChange={(v) => set({ difficulty: Number(v) as Level })} />
        </Field>
        <Field label="Organisatie">
          <ChipGroup size="sm" options={ORGANIZATIONS} value={x.organization} onChange={(organization) => set({ organization })} />
        </Field>
        <LinesField label="Coaching cues" value={x.cues} onChange={(cues) => set({ cues })} />
        <LinesField label="Veelvoorkomende fouten" value={x.mistakes} onChange={(mistakes) => set({ mistakes })} />
        <AreaField label="Veiligheid" value={x.safety ?? ""} onChange={(safety) => set({ safety: safety || undefined })} rows={2} />
        <TextField label="Eenvoudigere variant" value={x.easier ?? ""} onChange={(easier) => set({ easier: easier || undefined })} />
        <TextField label="Gevorderde variant" value={x.harder ?? ""} onChange={(harder) => set({ harder: harder || undefined })} />
        <TextField label="Mogelijke progressie" value={x.progression ?? ""} onChange={(progression) => set({ progression: progression || undefined })} />
        <RelationsField value={x} onChange={(relations) => set({ relations })} />
        <CsvField label="Tags" value={x.tags} onChange={(tags) => set({ tags })} />
        <CsvField label="Andere namen (aliassen)" value={x.aliases ?? []} onChange={(aliases) => set({ aliases: aliases.length ? aliases : undefined })} />
        <AreaField label="Eigen notities" value={x.notes ?? ""} onChange={(notes) => set({ notes: notes || undefined })} rows={2} />
      </More>
    </EditorSheet>
  );
}

function RelationsField({ value, onChange }: { value: Exercise; onChange: (r: Exercise["relations"]) => void }) {
  const lib = useLibrary();
  const [open, setOpen] = React.useState<null | "easier" | "harder" | "variation">(null);
  const rel = value.relations ?? [];
  const label = { easier: "Eenvoudiger", harder: "Moeilijker", variation: "Variatie" } as const;
  return (
    <Field label="Gekoppelde variaties">
      <div className="flex flex-wrap gap-1.5">
        {rel.map((r) => (
          <Tag key={`${r.kind}-${r.id}`}>
            {label[r.kind]}: {lib.exercise.get(r.id)?.name ?? r.id}
            <button type="button" aria-label="Koppeling verwijderen" onClick={() => onChange(rel.filter((x) => !(x.id === r.id && x.kind === r.kind)))}>
              <X className="size-3.5" />
            </button>
          </Tag>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["easier", "harder", "variation"] as const).map((k) => (
          <Button key={k} size="sm" variant="ghost" onClick={() => setOpen(k)}>
            <Plus /> {label[k]}
          </Button>
        ))}
      </div>
      <ExercisePicker
        open={open !== null}
        onOpenChange={(v) => !v && setOpen(null)}
        title="Koppel oefening"
        onPick={(e) => {
          if (open && e.id !== value.id) onChange([...rel, { kind: open, id: e.id }]);
          setOpen(null);
        }}
      />
    </Field>
  );
}

// ——— Format ———
export function newFormat(): Format {
  const now = nowIso();
  const structure = partnerAB(25, 5, 5);
  return {
    kind: "format", id: newId("fmt"), builtin: false, origin: "eigen", name: "", section: "partner", description: "", rule: "",
    mainGoal: "conditie", goals: [], phases: ["cardio"], rpe: [5, 7], durationSec: [300, 480], structure, intervalText: describeStructure(structure),
    workRest: describeWorkRest(structure), switchRule: "A en B wisselen na elk werkinterval.", organization: ["tweetallen"], partnerRoles: "", equipment: ["bokszak"],
    gloves: "aan", gloveLogistics: "Handschoenen blijven aan.", exerciseIds: [], community: "", example: "", pros: [], cons: [], cues: [], beginner: "", advanced: "",
    logistics: 1, difficulty: 1, competitive: false, partnerInteraction: "midden", createdAt: now, updatedAt: now,
  };
}

export function FormatEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial: Format }) {
  const [x, setX] = React.useState(initial);
  const save = useStore((s) => s.saveItem);
  const lib = useLibrary();
  const [pick, setPick] = React.useState(false);
  const set = (p: Partial<Format>) => setX((v) => ({ ...v, ...p }));
  const canSave = x.name.trim().length > 0 && x.description.trim().length > 0 && x.rule.trim().length > 0;
  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial.name ? `${initial.name} bewerken` : "Nieuw format"}
      canSave={canSave}
      onSave={() => {
        save({ ...x, name: x.name.trim(), intervalText: describeStructure(x.structure), workRest: describeWorkRest(x.structure), example: x.example || x.rule });
        toast(initial.builtin ? "Aanpassing opgeslagen (origineel blijft herstelbaar)" : "Format opgeslagen");
        onOpenChange(false);
      }}
    >
      <TextField label="Naam" required value={x.name} onChange={(name) => set({ name })} autoFocus={!initial.name} />
      <Field label="Soort">
        <Select value={x.section} onChange={(e) => set({ section: e.target.value as FormatSection })} aria-label="Soort format">
          {FORMAT_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <AreaField label="Korte omschrijving" required value={x.description} onChange={(description) => set({ description })} rows={2} />
      <AreaField label="Centrale spelregel" required value={x.rule} onChange={(rule) => set({ rule })} rows={3} hint="Wat is de regel waardoor dit format werkt?" />
      <AreaField label="Voorbeeld" value={x.example} onChange={(example) => set({ example })} rows={2} />
      <More defaultOpen={Boolean(initial.name)}>
        <Field label="Hoofddoel">
          <Select value={x.mainGoal} onChange={(e) => set({ mainGoal: e.target.value as Goal })} aria-label="Hoofddoel">
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Secundaire doelen">
          <ChipGroup size="sm" options={GOALS} value={x.goals} onChange={(goals) => set({ goals })} />
        </Field>
        <Field label="Geschikte lesfasen">
          <ChipGroup size="sm" options={PHASES} value={x.phases} onChange={(phases) => set({ phases: phases as Phase[] })} />
        </Field>
        <RangeField label="Intensiteit (RPE)" value={x.rpe} min={1} max={10} onChange={(rpe) => set({ rpe })} />
        <RangeField label="Aanbevolen duur (min)" value={[Math.round(x.durationSec[0] / 60), Math.round(x.durationSec[1] / 60)]} min={1} max={30} onChange={([a, b]) => set({ durationSec: [a * 60, b * 60] })} />
        <Field label="Standaard werkstructuur">
          <div className="rounded-xl border border-line p-3">
            <StructureEditor value={x.structure} onChange={(structure) => set({ structure })} />
          </div>
        </Field>
        <AreaField label="Wisselregel" value={x.switchRule} onChange={(switchRule) => set({ switchRule })} rows={2} />
        <Field label="Organisatie">
          <ChipGroup size="sm" options={ORGANIZATIONS} value={x.organization} onChange={(organization) => set({ organization })} />
        </Field>
        <AreaField label="Partnerrollen" value={x.partnerRoles} onChange={(partnerRoles) => set({ partnerRoles })} rows={2} />
        <Field label="Materiaal">
          <ChipGroup size="sm" options={EQUIPMENT} value={x.equipment} onChange={(equipment) => set({ equipment })} />
        </Field>
        <Field label="Handschoenen">
          <Segmented label="Handschoenen" options={GLOVE_FITS.map((g) => ({ id: g.id, label: g.id === "beide" ? "Beide" : g.id === "aan" ? "Aan" : "Uit" }))} value={x.gloves} onChange={(gloves) => set({ gloves: gloves as GloveFit })} />
        </Field>
        <TextField label="Handschoenenlogistiek" value={x.gloveLogistics} onChange={(gloveLogistics) => set({ gloveLogistics })} />
        <Field label="Geschikte oefeningen">
          <div className="flex flex-wrap gap-1.5">
            {x.exerciseIds.map((id) => (
              <Tag key={id}>
                {lib.exercise.get(id)?.name ?? id}
                <button type="button" aria-label="Verwijderen" onClick={() => set({ exerciseIds: x.exerciseIds.filter((i) => i !== id) })}>
                  <X className="size-3.5" />
                </button>
              </Tag>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setPick(true)}>
              <Plus /> Oefening
            </Button>
          </div>
        </Field>
        <AreaField label="Groepsdynamiek / communityfunctie" value={x.community} onChange={(community) => set({ community })} rows={2} />
        <LinesField label="Voordelen" value={x.pros} onChange={(pros) => set({ pros })} />
        <LinesField label="Nadelen" value={x.cons} onChange={(cons) => set({ cons })} />
        <LinesField label="Coaching cues" value={x.cues} onChange={(cues) => set({ cues })} />
        <TextField label="Beginnersvariant" value={x.beginner} onChange={(beginner) => set({ beginner })} />
        <TextField label="Gevorderde variant" value={x.advanced} onChange={(advanced) => set({ advanced })} />
        <Field label="Logistieke complexiteit">
          <Segmented label="Logistiek" options={[{ id: "1", label: "Eenvoudig" }, { id: "2", label: "Gemiddeld" }, { id: "3", label: "Complex" }]} value={String(x.logistics)} onChange={(v) => set({ logistics: Number(v) as Level })} />
        </Field>
        <Field label="Technische moeilijkheid">
          <Segmented label="Moeilijkheid" options={LEVELS} value={String(x.difficulty)} onChange={(v) => set({ difficulty: Number(v) as Level })} />
        </Field>
        <Field label="Partnerinteractie">
          <Segmented label="Partnerinteractie" options={[{ id: "laag", label: "Laag" }, { id: "midden", label: "Midden" }, { id: "hoog", label: "Hoog" }]} value={x.partnerInteraction} onChange={(v) => set({ partnerInteraction: v as Format["partnerInteraction"] })} />
        </Field>
        <Toggle label="Met competitie" checked={x.competitive} onChange={(competitive) => set({ competitive })} />
        <Field label="Maximaal aantal deelnemers (leeg = schaalt tot 32+)">
          <Input inputMode="numeric" value={x.maxParticipants ?? ""} onChange={(e) => set({ maxParticipants: Number(e.target.value) || undefined })} aria-label="Maximaal aantal deelnemers" />
        </Field>
        <AreaField label="Eigen notities" value={x.notes ?? ""} onChange={(notes) => set({ notes: notes || undefined })} rows={2} />
      </More>
      <ExercisePicker
        open={pick}
        onOpenChange={setPick}
        onPick={(e) => {
          if (!x.exerciseIds.includes(e.id)) set({ exerciseIds: [...x.exerciseIds, e.id] });
          setPick(false);
        }}
      />
    </EditorSheet>
  );
}

// ——— Lesstructuur ———
export function newTemplate(): LessonTemplate {
  const now = nowIso();
  return { kind: "template", id: newId("tpl"), builtin: false, origin: "eigen", name: "", description: "", focus: [], slots: [{ id: newId("slot"), title: "Warming-up", phase: "raise", durationSec: 480 }], createdAt: now, updatedAt: now };
}

export function TemplateEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial: LessonTemplate }) {
  const [x, setX] = React.useState(initial);
  const save = useStore((s) => s.saveItem);
  const set = (p: Partial<LessonTemplate>) => setX((v) => ({ ...v, ...p }));
  const total = x.slots.reduce((a, s) => a + s.durationSec, 0);
  const setSlot = (id: string, p: Partial<LessonTemplate["slots"][number]>) => set({ slots: x.slots.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const move = (i: number, d: -1 | 1) => {
    const l = x.slots.slice();
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    set({ slots: l });
  };
  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial.name ? `${initial.name} bewerken` : "Nieuwe lesstructuur"}
      canSave={x.name.trim().length > 0}
      onSave={() => {
        save({ ...x, name: x.name.trim() });
        toast("Lesstructuur opgeslagen");
        onOpenChange(false);
      }}
    >
      <TextField label="Naam" required value={x.name} onChange={(name) => set({ name })} autoFocus={!initial.name} />
      <AreaField label="Omschrijving" value={x.description} onChange={(description) => set({ description })} rows={2} />
      <Field label="Focus">
        <ChipGroup size="sm" options={GOALS} value={x.focus} onChange={(focus) => set({ focus })} />
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Onderdelen · totaal {Math.round(total / 60)} min</p>
        <ul className="flex flex-col gap-2">
          {x.slots.map((s, i) => (
            <li key={s.id} className="rounded-xl border border-line p-2">
              <div className="flex gap-2">
                <Input aria-label="Naam onderdeel" value={s.title} onChange={(e) => setSlot(s.id, { title: e.target.value })} className="h-10 flex-1" />
                <Select aria-label="Lesfase" value={s.phase} onChange={(e) => setSlot(s.id, { phase: e.target.value as Phase })} className="h-10 w-[150px]">
                  {PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.short}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Stepper label="Minuten" value={Math.round(s.durationSec / 60)} min={1} max={60} format={(v) => `${v} min`} onChange={(v) => setSlot(s.id, { durationSec: v * 60 })} />
                <div className="ml-auto flex">
                  <Button size="iconSm" variant="quiet" aria-label="Omhoog" onClick={() => move(i, -1)}><ArrowUp /></Button>
                  <Button size="iconSm" variant="quiet" aria-label="Omlaag" onClick={() => move(i, 1)}><ArrowDown /></Button>
                  <Button size="iconSm" variant="quiet" aria-label="Verwijderen" onClick={() => set({ slots: x.slots.filter((y) => y.id !== s.id) })}><Trash2 /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => set({ slots: [...x.slots, { id: newId("slot"), title: "Nieuw onderdeel", phase: "bag-basics", durationSec: 480 }] })}>
          <Plus /> Onderdeel
        </Button>
      </div>
    </EditorSheet>
  );
}

// ——— Trainingsblok (bibliotheek) ———
export function newTrainingBlock(): TrainingBlock {
  const now = nowIso();
  const base = emptyBlock("bag-basics", "", 360);
  const structure = partnerAB(25, 5, 5);
  return { ...base, kind: "block", id: newId("blk"), builtin: false, origin: "eigen", description: "", tags: [], structure, durationMode: "auto", durationSec: structureSeconds(structure), createdAt: now, updatedAt: now };
}

export function BlockEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial: TrainingBlock }) {
  const [x, setX] = React.useState(initial);
  const save = useStore((s) => s.saveItem);
  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial.title ? `${initial.title} bewerken` : "Nieuw trainingsblok"}
      canSave={x.title.trim().length > 0}
      onSave={() => {
        save({ ...x, title: x.title.trim(), description: x.description || x.instructions.split(/[.!?]/)[0] || x.title });
        toast(initial.builtin ? "Aanpassing opgeslagen (origineel blijft herstelbaar)" : "Trainingsblok opgeslagen");
        onOpenChange(false);
      }}
    >
      <AreaField label="Korte omschrijving" value={x.description} onChange={(description) => setX((v) => ({ ...v, description }))} rows={2} />
      <BlockForm value={x} onChange={setX} />
    </EditorSheet>
  );
}
