import type { Lesson, LessonBlock } from "@/lib/domain/types";
import { blockSeconds, structureSeconds } from "@/lib/time/structure";

export type StepKind = "explain" | "setup" | "work" | "rest" | "switch" | "reset" | "transition" | "block" | "buffer";

export interface Step {
  id: string;
  blockIndex: number;
  blockId: string;
  kind: StepKind;
  label: string;
  text?: string;
  seconds: number;
  round?: number;
  rounds?: number;
  /** Starttijd van deze stap binnen de les (seconden). */
  startSec: number;
}

/** Zet een les om in een lineaire tijdlijn van stappen voor de coachmodus. */
export function buildTimeline(lesson: Pick<Lesson, "blocks">): Step[] {
  const steps: Step[] = [];
  let t = 0;
  const push = (s: Omit<Step, "id" | "startSec">) => {
    if (s.seconds <= 0) return;
    steps.push({ ...s, id: `${s.blockId}-${steps.length}`, startSec: t });
    t += s.seconds;
  };
  lesson.blocks.forEach((b: LessonBlock, bi) => {
    const base = { blockIndex: bi, blockId: b.id };
    const s = b.structure;
    if (!s || s.intervals.length === 0) {
      push({ ...base, kind: "block", label: b.title, text: b.instructions || undefined, seconds: blockSeconds(b) });
      return;
    }
    push({ ...base, kind: "explain", label: "Uitleg", text: b.instructions || undefined, seconds: s.explainSec });
    push({ ...base, kind: "setup", label: "Opstellen / materiaal", seconds: s.setupSec });
    const rounds = Math.max(1, s.rounds);
    for (let r = 1; r <= rounds; r++) {
      for (const iv of s.intervals) push({ ...base, kind: iv.kind, label: iv.label, text: iv.text, seconds: iv.seconds, round: r, rounds });
      if (r < rounds) push({ ...base, kind: "rest", label: "Rust tussen rondes", seconds: s.restBetweenRoundsSec, round: r, rounds });
    }
    push({ ...base, kind: "transition", label: "Overgang", seconds: s.transitionSec });
    const extra = blockSeconds(b) - structureSeconds(s);
    if (extra > 0) push({ ...base, kind: "buffer", label: "Vrije tijd (buffer)", seconds: extra });
  });
  return steps;
}

export function totalSeconds(steps: Step[]): number {
  return steps.reduce((a, s) => a + s.seconds, 0);
}

export function firstStepOfBlock(steps: Step[], blockIndex: number): number {
  const i = steps.findIndex((s) => s.blockIndex === blockIndex);
  return i < 0 ? 0 : i;
}
