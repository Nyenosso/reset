"use client";

import * as React from "react";
import { GripVertical, Plus, Repeat2, Trash2, X, AlertTriangle } from "lucide-react";
import type { BlockContent, BlockExercise, Format } from "@/lib/domain/types";
import { BLOCK_GLOVES, EQUIPMENT, GOALS, ORGANIZATIONS, PHASES, type BlockGloves, type Organization, type Phase } from "@/lib/domain/vocab";
import { partnerAB } from "@/lib/time/presets";
import { blockTimeStatus, structureSeconds } from "@/lib/time/structure";
import { formatClock, formatDuration, parseDuration } from "@/lib/time/format";
import { applyFormatToBlock, addExerciseToBlock } from "@/lib/data/lesson-ops";
import { newId } from "@/lib/utils/id";
import { moveItem } from "@/lib/data/lesson-ops";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ChipGroup } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { AreaField, LinesField, More, RangeField } from "@/components/shared/form";
import { ExercisePicker } from "@/components/shared/exercise-picker";
import { SortableList } from "@/components/shared/sortable-list";
import { FormatSelect } from "./format-select";
import { StructureEditor } from "./structure-editor";

type Content = BlockContent & { placeholder?: boolean };

/**
 * Bewerkt de inhoud van een blok (lesblok of bibliotheekblok).
 * Wijzigingen gaan direct via onChange (in de lesmaker = autosave).
 */
export function BlockForm<T extends Content>({ value, onChange }: { value: T; onChange: (next: T) => void }) {
  const [pickEx, setPickEx] = React.useState(false);
  const [pickFormat, setPickFormat] = React.useState(false);

  const update = (patch: Partial<Content>) => {
    const next = { ...value, ...patch, placeholder: false } as T;
    if (next.durationMode === "auto" && next.structure) next.durationSec = structureSeconds(next.structure);
    onChange(next);
  };
  const setEx = (exercises: BlockExercise[]) => update({ exercises });
  const time = blockTimeStatus(value);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
        <Field label="Titel">
          <Input value={value.title} onChange={(e) => update({ title: e.target.value })} aria-label="Titel van het blok" />
        </Field>
        <Field label="Lesfase">
          <Select value={value.phase} onChange={(e) => update({ phase: e.target.value as Phase })} aria-label="Lesfase">
            {PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <DurationCard value={value} update={update} mismatch={time.mismatch} computed={time.computed} />

      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-muted">Format</h3>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setPickFormat(true)}>
              <Repeat2 /> {value.formatId ? "Wijzig" : "Kies format"}
            </Button>
            {value.formatId && (
              <Button size="sm" variant="quiet" aria-label="Format loskoppelen" onClick={() => update({ formatId: undefined, formatName: undefined })}>
                <X />
              </Button>
            )}
          </div>
        </div>
        <p className="rounded-lg bg-subtle/60 px-3 py-2.5 text-[15px]">{value.formatName ?? <span className="text-faint">Geen format gekozen</span>}</p>
      </section>

      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-muted">Oefeningen</h3>
          <Button size="sm" variant="ghost" onClick={() => setPickEx(true)} data-testid="add-exercise-to-block">
            <Plus /> Oefening
          </Button>
        </div>
        {value.exercises.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-faint">Nog geen oefeningen</p>
        ) : (
          <SortableList
            items={value.exercises}
            getId={(e) => e.id}
            onMove={(a, b) => setEx(moveItem(value.exercises, a, b))}
            className="flex flex-col gap-1.5"
            render={(e, i, h) => (
              <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface p-1.5">
                <button ref={h.ref} {...h.attributes} {...h.listeners} type="button" aria-label={`Verplaats ${e.name}`} className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded text-faint active:cursor-grabbing">
                  <GripVertical className="size-5" />
                </button>
                <Input aria-label="Label" placeholder="Label" value={e.tag ?? ""} onChange={(ev) => setEx(value.exercises.map((x) => (x.id === e.id ? { ...x, tag: ev.target.value || undefined } : x)))} className="h-9 w-16 shrink-0 px-2 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{e.name}</p>
                  <input aria-label={`Aantal voor ${e.name}`} placeholder="aantal / duur" value={e.amount ?? ""} onChange={(ev) => setEx(value.exercises.map((x) => (x.id === e.id ? { ...x, amount: ev.target.value || undefined } : x)))} className="w-full bg-transparent text-[13px] text-muted outline-none placeholder:text-faint" />
                </div>
                <Button size="iconSm" variant="quiet" aria-label={`${e.name} verwijderen`} onClick={() => setEx(value.exercises.filter((x) => x.id !== e.id))}>
                  <Trash2 />
                </Button>
                <span className="sr-only">Positie {i + 1}</span>
              </div>
            )}
          />
        )}
      </section>

      <section>
        <h3 className="mb-1.5 text-[13px] font-medium text-muted">Werkstructuur</h3>
        {value.structure ? (
          <div className="rounded-xl border border-line p-3">
            <StructureEditor value={value.structure} onChange={(s) => update({ structure: s })} />
            <Button size="sm" variant="dangerGhost" className="mt-2" onClick={() => update({ structure: null, durationMode: "manual" })}>
              Structuur verwijderen (alleen tijdslot)
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => update({ structure: partnerAB(25, 5, 5), durationMode: "auto" })}>
            <Plus /> Intervalstructuur toevoegen
          </Button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Organisatie">
          <Select value={value.organization} onChange={(e) => update({ organization: e.target.value as Organization })} aria-label="Organisatie">
            {ORGANIZATIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Handschoenen">
          <Segmented label="Handschoenen" options={BLOCK_GLOVES.map((g) => ({ id: g.id, label: g.label }))} value={value.gloves} onChange={(g) => update({ gloves: g as BlockGloves })} />
        </Field>
      </div>
      <Field label="Materiaal">
        <ChipGroup size="sm" options={EQUIPMENT} value={value.equipment} onChange={(equipment) => update({ equipment })} />
      </Field>
      <RangeField label="Intensiteit (RPE)" value={value.rpe} min={1} max={10} onChange={(rpe) => update({ rpe })} />
      <AreaField label="Instructie" value={value.instructions} onChange={(instructions) => update({ instructions })} placeholder="Wat doen de deelnemers?" rows={3} />
      <AreaField label="Partnerrollen" value={value.partnerRoles} onChange={(partnerRoles) => update({ partnerRoles })} placeholder="A slaat, B houdt de zak en …" rows={2} />
      <LinesField label="Coaching cues" value={value.cues} onChange={(cues) => update({ cues })} />
      <More title="Doelen, varianten en notities">
        <Field label="Trainingsdoelen">
          <ChipGroup size="sm" options={GOALS} value={value.goals} onChange={(goals) => update({ goals })} />
        </Field>
        <AreaField label="Makkelijker" value={value.easier} onChange={(easier) => update({ easier })} rows={2} />
        <AreaField label="Moeilijker" value={value.harder} onChange={(harder) => update({ harder })} rows={2} />
        <AreaField label="Notities" value={value.notes} onChange={(notes) => update({ notes })} rows={2} />
      </More>

      <ExercisePicker
        open={pickEx}
        onOpenChange={setPickEx}
        onPick={(e) => {
          onChange(addExerciseToBlock({ ...value, placeholder: false }, e) as T);
          setPickEx(false);
        }}
        onPickText={(text) => {
          setEx([...value.exercises, { id: newId("bx"), name: text }]);
          setPickEx(false);
        }}
      />
      <FormatSelect
        open={pickFormat}
        onOpenChange={setPickFormat}
        onPick={(f: Format) => {
          onChange(applyFormatToBlock(value, f) as T);
          setPickFormat(false);
        }}
      />
    </div>
  );
}

function DurationCard({ value, update, mismatch, computed }: { value: Content; update: (p: Partial<Content>) => void; mismatch: boolean; computed: number | null }) {
  const planned = value.durationMode === "auto" && value.structure ? structureSeconds(value.structure) : value.durationSec;
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const sec = parseDuration(draft);
    if (sec !== null && sec > 0) update({ durationMode: "manual", durationSec: sec });
    setDraft(null);
  };
  const bump = (d: number) => update({ durationMode: "manual", durationSec: Math.max(30, planned + d) });
  return (
    <section className="rounded-xl border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <p className="text-[12px] font-medium text-muted">Duur {value.durationMode === "auto" && value.structure ? "(berekend)" : "(vast)"}</p>
          <input
            aria-label="Duur van het blok (mm:ss)"
            inputMode="numeric"
            className="w-24 bg-transparent text-[26px] font-semibold tracking-tight outline-none tabular"
            value={draft ?? formatClock(planned)}
            onFocus={(e) => {
              setDraft(formatClock(planned));
              e.target.select();
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={() => bump(-30)} aria-label="30 seconden korter">−30s</Button>
        <Button size="sm" variant="secondary" onClick={() => bump(30)} aria-label="30 seconden langer">+30s</Button>
        <Button size="sm" variant="secondary" onClick={() => bump(60)} aria-label="1 minuut langer">+1m</Button>
      </div>
      {value.structure && value.durationMode === "manual" && (
        <button type="button" className="mt-2 text-[13px] font-medium text-accent" onClick={() => update({ durationMode: "auto" })}>
          Gebruik de berekende duur ({formatDuration(computed ?? 0)})
        </button>
      )}
      {mismatch && computed !== null && (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {computed > planned
            ? `De structuur duurt ${formatDuration(computed)}: ${formatDuration(computed - planned)} langer dan gepland.`
            : `De structuur vult ${formatDuration(computed)}; ${formatDuration(planned - computed)} is nog niet ingevuld.`}
        </p>
      )}
    </section>
  );
}
