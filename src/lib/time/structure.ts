import type { BlockContent, BlockStructure, Interval, Lesson, Seconds } from "@/lib/domain/types";
import { formatDuration } from "./format";

const int = (n: unknown) => (Number.isFinite(n as number) ? Math.max(0, Math.round(n as number)) : 0);

/** Duur van één ronde (som van de intervallen). */
export function roundSeconds(s: BlockStructure): Seconds {
  return s.intervals.reduce((sum, i) => sum + int(i.seconds), 0);
}

/** Netto werktijd: alle rondes zonder uitleg, opstellen en overgang. */
export function workSeconds(s: BlockStructure): Seconds {
  const rounds = Math.max(1, int(s.rounds));
  return rounds * roundSeconds(s) + Math.max(0, rounds - 1) * int(s.restBetweenRoundsSec);
}

/** Volledige duur van een structuur, inclusief uitleg, opstellen en overgang. */
export function structureSeconds(s: BlockStructure): Seconds {
  return int(s.explainSec) + int(s.setupSec) + workSeconds(s) + int(s.transitionSec);
}

/** De duur waarmee een blok in de les meetelt. */
export function blockSeconds(b: Pick<BlockContent, "structure" | "durationMode" | "durationSec">): Seconds {
  if (b.durationMode === "auto" && b.structure) return structureSeconds(b.structure);
  return int(b.durationSec);
}

export interface BlockTimeStatus {
  planned: Seconds;
  /** Berekend uit de structuur (null als er geen structuur is). */
  computed: Seconds | null;
  /** computed - planned (positief = structuur duurt langer dan gepland). */
  diff: number;
  mismatch: boolean;
}

export function blockTimeStatus(b: Pick<BlockContent, "structure" | "durationMode" | "durationSec">): BlockTimeStatus {
  const planned = blockSeconds(b);
  const computed = b.structure ? structureSeconds(b.structure) : null;
  const diff = computed === null ? 0 : computed - planned;
  return { planned, computed, diff, mismatch: computed !== null && b.durationMode === "manual" && diff !== 0 };
}

export interface LessonTotals {
  planned: Seconds;
  target: Seconds;
  /** target - planned; negatief = overschrijding. */
  remaining: Seconds;
  over: Seconds;
  blocks: { id: string; start: Seconds; duration: Seconds }[];
}

export function lessonTotals(lesson: Pick<Lesson, "blocks" | "targetSec">): LessonTotals {
  let t = 0;
  const blocks = lesson.blocks.map((b) => {
    const duration = blockSeconds(b);
    const entry = { id: b.id, start: t, duration };
    t += duration;
    return entry;
  });
  const target = int(lesson.targetSec);
  return { planned: t, target, remaining: target - t, over: Math.max(0, t - target), blocks };
}

/** Werk/rust per deelnemer. Bij A/B-intervallen wordt vanuit één deelnemer gerekend. */
export function workRestPerParticipant(s: BlockStructure): { work: Seconds; rest: Seconds } {
  const round = roundSeconds(s);
  const work = s.intervals.filter((i) => i.kind === "work");
  const roles = new Set(work.map((i) => roleOf(i)).filter(Boolean));
  let w: number;
  if (roles.size >= 2) {
    const first = [...roles][0];
    w = work.filter((i) => roleOf(i) === first).reduce((a, i) => a + int(i.seconds), 0);
  } else {
    w = work.reduce((a, i) => a + int(i.seconds), 0);
  }
  return { work: w, rest: round - w + int(s.restBetweenRoundsSec) };
}

function roleOf(i: Interval): string | null {
  const m = i.label.trim().match(/^([A-D])(\b|\s|$)/);
  return m ? m[1] : null;
}

export function describeWorkRest(s: BlockStructure): string {
  const { work, rest } = workRestPerParticipant(s);
  if (work === 0) return "Doorlopend herstel";
  if (rest <= 0) return `${formatDuration(work)} doorlopend werk`;
  const ratio = rest / work;
  const r = Math.round(ratio * 10) / 10;
  return `${formatDuration(work)} werk : ${formatDuration(rest)} herstel (1 : ${String(r).replace(".", ",")})`;
}

/** Korte beschrijving: "5 × (25 A · 5 wissel · 25 B · 5 reset)". */
export function describeStructure(s: BlockStructure): string {
  const parts = s.intervals.map((i) => `${i.seconds} ${i.label}`.trim());
  const inner = parts.join(" · ");
  const rounds = Math.max(1, s.rounds);
  const core = rounds > 1 ? `${rounds} × (${inner})` : inner;
  const extras: string[] = [];
  if (s.restBetweenRoundsSec > 0 && rounds > 1) extras.push(`${s.restBetweenRoundsSec} s rust tussen rondes`);
  return extras.length ? `${core}; ${extras.join(", ")}` : core;
}

/** Uitgebreide tijdsopbouw voor weergave. */
export function structureBreakdown(s: BlockStructure): { label: string; seconds: Seconds }[] {
  const rows: { label: string; seconds: Seconds }[] = [];
  if (s.explainSec) rows.push({ label: "Uitleg", seconds: s.explainSec });
  if (s.setupSec) rows.push({ label: "Opstellen / materiaal", seconds: s.setupSec });
  const rounds = Math.max(1, s.rounds);
  rows.push({ label: `${rounds} ${rounds === 1 ? "ronde" : "rondes"} × ${formatDuration(roundSeconds(s))}`, seconds: rounds * roundSeconds(s) });
  if (s.restBetweenRoundsSec && rounds > 1)
    rows.push({ label: `Rust tussen rondes (${rounds - 1}×)`, seconds: (rounds - 1) * s.restBetweenRoundsSec });
  if (s.transitionSec) rows.push({ label: "Overgang", seconds: s.transitionSec });
  return rows;
}
