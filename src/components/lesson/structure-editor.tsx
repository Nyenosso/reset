"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Wand2 } from "lucide-react";
import type { BlockStructure, Interval } from "@/lib/domain/types";
import { INTERVAL_KINDS, type IntervalKind } from "@/lib/domain/vocab";
import { STRUCTURE_PRESETS, withFreshIds } from "@/lib/time/presets";
import { formatClock, formatDuration } from "@/lib/time/format";
import { describeWorkRest, roundSeconds, structureSeconds } from "@/lib/time/structure";
import { newId } from "@/lib/utils/id";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { cn } from "@/components/ui/cn";

const secFmt = (v: number) => (v >= 60 ? formatClock(v) : `${v}s`);

/** Bewerkt een werkstructuur: uitleg, rondes, intervallen, rust en overgang. */
export function StructureEditor({ value, onChange }: { value: BlockStructure; onChange: (s: BlockStructure) => void }) {
  const set = (patch: Partial<BlockStructure>) => onChange({ ...value, ...patch });
  const setInterval = (id: string, patch: Partial<Interval>) => set({ intervals: value.intervals.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const move = (idx: number, dir: -1 | 1) => {
    const list = value.intervals.slice();
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    set({ intervals: list });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted">
          Ronde: <span className="font-semibold text-ink tabular">{formatClock(roundSeconds(value))}</span> · Totaal:{" "}
          <span className="font-semibold text-ink tabular">{formatClock(structureSeconds(value))}</span>
        </p>
        <Menu>
          <MenuTrigger asChild>
            <Button size="sm" variant="secondary">
              <Wand2 /> Snelkeuze
            </Button>
          </MenuTrigger>
          <MenuContent>
            {STRUCTURE_PRESETS.map((p) => (
              <MenuItem key={p.id} onSelect={() => onChange({ ...withFreshIds(p.build()), explainSec: value.explainSec, setupSec: value.setupSec, transitionSec: value.transitionSec })}>
                {p.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
        <Labeled label="Uitleg">
          <Stepper label="Uitleg" value={value.explainSec} step={15} max={600} format={secFmt} onChange={(v) => set({ explainSec: v })} />
        </Labeled>
        <Labeled label="Rondes">
          <Stepper label="Rondes" value={value.rounds} min={1} max={60} onChange={(v) => set({ rounds: v })} />
        </Labeled>
        <Labeled label="Opstellen / materiaal">
          <Stepper label="Opstellen" value={value.setupSec} step={15} max={600} format={secFmt} onChange={(v) => set({ setupSec: v })} />
        </Labeled>
        <Labeled label="Rust tussen rondes">
          <Stepper label="Rust tussen rondes" value={value.restBetweenRoundsSec} step={5} max={300} format={secFmt} onChange={(v) => set({ restBetweenRoundsSec: v })} />
        </Labeled>
        <Labeled label="Overgang / drinken">
          <Stepper label="Overgang" value={value.transitionSec} step={15} max={600} format={secFmt} onChange={(v) => set({ transitionSec: v })} />
        </Labeled>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-muted">Intervallen per ronde</p>
        <ul className="flex flex-col gap-2">
          {value.intervals.map((iv, idx) => (
            <li key={iv.id} className={cn("rounded-xl border border-line p-2", iv.kind === "work" ? "bg-surface" : "bg-subtle/60")}>
              <div className="flex items-center gap-2">
                <Input aria-label="Label interval" value={iv.label} onChange={(e) => setInterval(iv.id, { label: e.target.value })} className="h-10 min-w-0 flex-1" />
                <Select aria-label="Soort interval" value={iv.kind} onChange={(e) => setInterval(iv.id, { kind: e.target.value as IntervalKind })} className="h-10 w-[104px]">
                  {INTERVAL_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Stepper label={`Duur ${iv.label}`} value={iv.seconds} step={5} min={0} max={1800} format={secFmt} onChange={(v) => setInterval(iv.id, { seconds: v })} />
                <div className="ml-auto flex">
                  <Button size="iconSm" variant="quiet" aria-label="Omhoog" onClick={() => move(idx, -1)} disabled={idx === 0}>
                    <ArrowUp />
                  </Button>
                  <Button size="iconSm" variant="quiet" aria-label="Omlaag" onClick={() => move(idx, 1)} disabled={idx === value.intervals.length - 1}>
                    <ArrowDown />
                  </Button>
                  <Button size="iconSm" variant="quiet" aria-label="Interval verwijderen" onClick={() => set({ intervals: value.intervals.filter((x) => x.id !== iv.id) })}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <Input aria-label="Opdracht tijdens interval" placeholder="Opdracht (optioneel)" value={iv.text ?? ""} onChange={(e) => setInterval(iv.id, { text: e.target.value || undefined })} className="mt-2 h-10" />
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          variant="ghost"
          className="mt-2"
          onClick={() => set({ intervals: [...value.intervals, { id: newId("int"), label: value.intervals.length % 2 ? "Rust" : "Werk", kind: value.intervals.length % 2 ? "rest" : "work", seconds: value.intervals.length % 2 ? 10 : 30 }] })}
        >
          <Plus /> Interval
        </Button>
      </div>
      <p className="text-[13px] text-faint">{describeWorkRest(value)} · {formatDuration(structureSeconds(value))} inclusief uitleg en overgang</p>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}
