"use client";

import * as React from "react";
import { Plus, Star } from "lucide-react";
import type { Exercise, Format, LessonTemplate, TrainingBlock } from "@/lib/domain/types";
import { categoryLabel, goalLabel, muscleLabel, organizationLabel, phaseLabel } from "@/lib/domain/vocab";
import { formatDuration, formatRange, formatRpe } from "@/lib/time/format";
import { blockSeconds } from "@/lib/time/structure";
import { useIsFavorite, useStore } from "@/lib/store";
import { cn } from "@/components/ui/cn";

function FavButton({ kind, id, name }: { kind: "exercise" | "format" | "block" | "template"; id: string; name: string }) {
  const fav = useIsFavorite(kind, id);
  const toggle = useStore((s) => s.toggleFavorite);
  return (
    <button
      type="button"
      onClick={() => toggle(kind, id)}
      aria-pressed={fav}
      aria-label={fav ? `${name} uit favorieten` : `${name} als favoriet`}
      className="grid size-11 shrink-0 place-items-center rounded-full text-faint hover:bg-subtle"
    >
      <Star className={cn("size-[18px]", fav && "fill-[#e8a33d] text-[#d48a1c]")} />
    </button>
  );
}

function AddButton({ onClick, name }: { onClick: () => void; name: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${name} toevoegen aan les`} className="grid size-11 shrink-0 place-items-center rounded-full text-accent hover:bg-accent-soft" data-testid="add-to-lesson">
      <Plus className="size-[22px]" strokeWidth={2.25} />
    </button>
  );
}

function CardShell({ onOpen, children, actions, label }: { onOpen: () => void; children: React.ReactNode; actions: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 border-b border-line/70 py-1 pl-1">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left hover:bg-subtle/60" aria-label={`${label} bekijken`}>
        {children}
      </button>
      {actions}
    </div>
  );
}

export function exerciseMeta(e: Exercise): string {
  const muscles = e.musclesPrimary.slice(0, 2).map(muscleLabel);
  return [...muscles, categoryLabel(e.category)].join(" · ");
}

export function exerciseDose(e: Exercise): string {
  const parts = [e.reps ? `${e.reps} herh.` : formatRange(e.durationSec), formatRpe(e.rpe)];
  if (e.gloves === "aan") parts.push("Handschoenen aan");
  if (e.gloves === "uit") parts.push("Handschoenen uit");
  return parts.join(" · ");
}

export function ExerciseCard({ e, onOpen, onAdd, modified }: { e: Exercise; onOpen: () => void; onAdd: () => void; modified?: boolean }) {
  const alias = /^[\d-]+$/.test(e.name) && e.aliases?.[0] ? e.aliases[0] : undefined;
  return (
    <CardShell onOpen={onOpen} label={e.name} actions={<><FavButton kind="exercise" id={e.id} name={e.name} /><AddButton onClick={onAdd} name={e.name} /></>}>
      <p className="truncate text-[15px] font-semibold">
        {e.name}
        {alias && <span className="font-normal text-faint"> · {alias}</span>}
        {(modified || !e.builtin) && <span className="ml-1.5 align-middle text-[11px] font-medium text-accent">{e.builtin ? "aangepast" : "eigen"}</span>}
      </p>
      <p className="truncate text-[13px] text-muted">{exerciseMeta(e)}</p>
      <p className="truncate text-[13px] text-faint tabular">{exerciseDose(e)}</p>
    </CardShell>
  );
}

export function FormatCard({ f, onOpen, onAdd, modified }: { f: Format; onOpen: () => void; onAdd: () => void; modified?: boolean }) {
  return (
    <CardShell onOpen={onOpen} label={f.name} actions={<><FavButton kind="format" id={f.id} name={f.name} /><AddButton onClick={onAdd} name={f.name} /></>}>
      <p className="truncate text-[15px] font-semibold">
        {f.name}
        {(modified || !f.builtin) && <span className="ml-1.5 align-middle text-[11px] font-medium text-accent">{f.builtin ? "aangepast" : "eigen"}</span>}
      </p>
      <p className="truncate text-[13px] text-muted">
        {[goalLabel(f.mainGoal), ...f.goals.slice(0, 1).map(goalLabel), formatRange(f.durationSec)].join(" · ")}
      </p>
      <p className="line-clamp-2 text-[13px] text-faint">‘{f.description}’</p>
    </CardShell>
  );
}

export function BlockCardLib({ b, onOpen, onAdd, modified }: { b: TrainingBlock; onOpen: () => void; onAdd: () => void; modified?: boolean }) {
  return (
    <CardShell onOpen={onOpen} label={b.title} actions={<><FavButton kind="block" id={b.id} name={b.title} /><AddButton onClick={onAdd} name={b.title} /></>}>
      <p className="truncate text-[15px] font-semibold">
        {b.title}
        {(modified || !b.builtin) && <span className="ml-1.5 align-middle text-[11px] font-medium text-accent">{b.builtin ? "aangepast" : "eigen"}</span>}
      </p>
      <p className="truncate text-[13px] text-muted">{[phaseLabel(b.phase), b.formatName].filter(Boolean).join(" · ")}</p>
      <p className="truncate text-[13px] text-faint tabular">{[formatDuration(blockSeconds(b)), organizationLabel(b.organization), formatRpe(b.rpe)].join(" · ")}</p>
    </CardShell>
  );
}

export function TemplateCard({ t, onOpen, onAdd }: { t: LessonTemplate; onOpen: () => void; onAdd: () => void }) {
  const total = t.slots.reduce((a, s) => a + s.durationSec, 0);
  return (
    <CardShell onOpen={onOpen} label={t.name} actions={<><FavButton kind="template" id={t.id} name={t.name} /><AddButton onClick={onAdd} name={t.name} /></>}>
      <p className="truncate text-[15px] font-semibold">{t.name}</p>
      <p className="truncate text-[13px] text-muted">{t.slots.length ? `${t.slots.length} onderdelen · ${formatDuration(total)}` : "Leeg · 60 min"}</p>
      <p className="line-clamp-1 text-[13px] text-faint">{t.slots.length ? t.slots.map((s) => s.title).join(" → ") : t.description}</p>
    </CardShell>
  );
}
