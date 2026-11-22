"use client";

import * as React from "react";
import {
  DURATION_BUCKETS,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FORMAT_SECTIONS,
  GLOVE_FITS,
  GOALS,
  INTENSITIES,
  MUSCLES,
  ORGANIZATIONS,
  ORIGINS,
  PHASES,
  type Level,
} from "@/lib/domain/vocab";
import { useUi, type LibTab } from "@/lib/store/ui";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { Toggle } from "@/components/shared/form";

const LEVELS = [
  { id: "1", label: "Basis" },
  { id: "2", label: "Gemiddeld" },
  { id: "3", label: "Gevorderd" },
] as const;

export function FiltersSheet({ tab, open, onOpenChange }: { tab: LibTab; open: boolean; onOpenChange: (v: boolean) => void }) {
  const ui = useUi();
  const available = useStore((s) => s.data.prefs.equipmentAvailable);
  const clear = () => {
    if (tab === "oefeningen") ui.setExerciseFilters({});
    if (tab === "formats") ui.setFormatFilters({});
    if (tab === "blokken") ui.setBlockFilters({});
  };
  const ef = ui.exerciseFilters;
  const ff = ui.formatFilters;
  const bf = ui.blockFilters;
  const durationIds = (r?: [number, number]) => (r ? DURATION_BUCKETS.filter((b) => b.range[0] === r[0] && b.range[1] === r[1]).map((b) => b.id) : []);
  const rpeIds = (r?: [number, number]) => (r ? INTENSITIES.filter((b) => b.range[0] === r[0] && b.range[1] === r[1]).map((b) => b.id) : []);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <div className="flex justify-between">
          <Button variant="ghost" onClick={clear}>
            Wissen
          </Button>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Toon resultaten
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {tab === "oefeningen" && (
          <>
            <Field label="Categorie"><ChipGroup size="sm" options={EXERCISE_CATEGORIES} value={ef.categories ?? []} onChange={(categories) => ui.setExerciseFilters({ ...ef, categories })} /></Field>
            <Field label="Lesfase"><ChipGroup size="sm" options={PHASES} value={ef.phases ?? []} onChange={(phases) => ui.setExerciseFilters({ ...ef, phases })} /></Field>
            <Field label="Doel"><ChipGroup size="sm" options={GOALS} value={ef.goals ?? []} onChange={(goals) => ui.setExerciseFilters({ ...ef, goals })} /></Field>
            <Field label="Spiergroep"><ChipGroup size="sm" options={MUSCLES} value={ef.muscles ?? []} onChange={(muscles) => ui.setExerciseFilters({ ...ef, muscles })} /></Field>
            <Field label="Materiaal"><ChipGroup size="sm" options={EQUIPMENT} value={ef.equipment ?? []} onChange={(equipment) => ui.setExerciseFilters({ ...ef, equipment })} /></Field>
            <Field label="Handschoenen"><ChipGroup size="sm" options={GLOVE_FITS.filter((g) => g.id !== "beide")} value={ef.gloves ?? []} onChange={(gloves) => ui.setExerciseFilters({ ...ef, gloves })} /></Field>
            <Field label="Moeilijkheid"><ChipGroup size="sm" options={LEVELS} value={(ef.difficulty ?? []).map(String) as ("1" | "2" | "3")[]} onChange={(v) => ui.setExerciseFilters({ ...ef, difficulty: v.map(Number) as Level[] })} /></Field>
            <Field label="Organisatie"><ChipGroup size="sm" options={ORGANIZATIONS} value={ef.organization ?? []} onChange={(organization) => ui.setExerciseFilters({ ...ef, organization })} /></Field>
            <Toggle label="Alleen met mijn beschikbare materiaal" checked={Boolean(ef.onlyAvailable)} onChange={(v) => ui.setExerciseFilters({ ...ef, onlyAvailable: v ? available : undefined })} />
          </>
        )}
        {tab === "formats" && (
          <>
            <Field label="Soort"><ChipGroup size="sm" options={FORMAT_SECTIONS} value={ff.sections ?? []} onChange={(sections) => ui.setFormatFilters({ ...ff, sections })} /></Field>
            <Field label="Lesfase"><ChipGroup size="sm" options={PHASES} value={ff.phases ?? []} onChange={(phases) => ui.setFormatFilters({ ...ff, phases })} /></Field>
            <Field label="Doel"><ChipGroup size="sm" options={GOALS} value={ff.goals ?? []} onChange={(goals) => ui.setFormatFilters({ ...ff, goals })} /></Field>
            <Field label="Duur"><ChipGroup size="sm" multiple={false} options={DURATION_BUCKETS} value={durationIds(ff.duration)} onChange={(v) => ui.setFormatFilters({ ...ff, duration: DURATION_BUCKETS.find((b) => b.id === v[0])?.range })} /></Field>
            <Field label="Intensiteit"><ChipGroup size="sm" multiple={false} options={INTENSITIES} value={rpeIds(ff.rpe)} onChange={(v) => ui.setFormatFilters({ ...ff, rpe: INTENSITIES.find((b) => b.id === v[0])?.range })} /></Field>
            <Field label="Organisatie"><ChipGroup size="sm" options={ORGANIZATIONS} value={ff.organization ?? []} onChange={(organization) => ui.setFormatFilters({ ...ff, organization })} /></Field>
            <Field label="Materiaal"><ChipGroup size="sm" options={EQUIPMENT} value={ff.equipment ?? []} onChange={(equipment) => ui.setFormatFilters({ ...ff, equipment })} /></Field>
            <Field label="Logistiek"><ChipGroup size="sm" options={[{ id: "1", label: "Eenvoudig" }, { id: "2", label: "Gemiddeld" }, { id: "3", label: "Complex" }] as const} value={(ff.logistics ?? []).map(String) as ("1" | "2" | "3")[]} onChange={(v) => ui.setFormatFilters({ ...ff, logistics: v.map(Number) as Level[] })} /></Field>
            <Field label="Herkomst"><ChipGroup size="sm" options={ORIGINS} value={ff.origins ?? []} onChange={(origins) => ui.setFormatFilters({ ...ff, origins })} /></Field>
          </>
        )}
        {tab === "blokken" && (
          <>
            <Field label="Lesfase"><ChipGroup size="sm" options={PHASES} value={bf.phases ?? []} onChange={(phases) => ui.setBlockFilters({ ...bf, phases })} /></Field>
            <Field label="Doel"><ChipGroup size="sm" options={GOALS} value={bf.goals ?? []} onChange={(goals) => ui.setBlockFilters({ ...bf, goals })} /></Field>
            <Field label="Duur"><ChipGroup size="sm" multiple={false} options={DURATION_BUCKETS} value={durationIds(bf.duration)} onChange={(v) => ui.setBlockFilters({ ...bf, duration: DURATION_BUCKETS.find((b) => b.id === v[0])?.range })} /></Field>
            <Field label="Organisatie"><ChipGroup size="sm" options={ORGANIZATIONS} value={bf.organization ?? []} onChange={(organization) => ui.setBlockFilters({ ...bf, organization })} /></Field>
          </>
        )}
        {tab === "structuren" && <p className="text-muted">Lesstructuren hebben geen filters; gebruik de zoekbalk.</p>}
      </div>
    </Sheet>
  );
}
