import type { BlockStructure, Interval } from "@/lib/domain/types";
import type { IntervalKind } from "@/lib/domain/vocab";
import { newId } from "@/lib/utils/id";

/**
 * Bouwstenen voor werkstructuren. Gebruikt door de seeddata én door de
 * snelkeuzes in de blokeditor. Intervallen krijgen pas een id via `withIds`.
 */
export type IntervalSpec = [label: string, kind: IntervalKind, seconds: number, text?: string];

export interface StructureOpts {
  explain?: number;
  setup?: number;
  restBetween?: number;
  transition?: number;
}

export function structure(rounds: number, specs: IntervalSpec[], o: StructureOpts = {}): BlockStructure {
  return {
    explainSec: o.explain ?? 60,
    setupSec: o.setup ?? 0,
    rounds,
    intervals: specs.map(([label, kind, seconds, text], idx) => ({
      id: `i${idx + 1}`,
      label,
      kind,
      seconds,
      ...(text ? { text } : {}),
    })),
    restBetweenRoundsSec: o.restBetween ?? 0,
    transitionSec: o.transition ?? 0,
  };
}

/** Partnerwissel A/B: A werkt, wissel, B werkt, reset. */
export function partnerAB(work: number, sw: number, rounds: number, o: StructureOpts & { reset?: number; textA?: string; textB?: string } = {}) {
  return structure(
    rounds,
    [
      ["A werkt", "work", work, o.textA],
      ["Wissel", "switch", sw],
      ["B werkt", "work", work, o.textB],
      ["Reset", "reset", o.reset ?? sw],
    ],
    o,
  );
}

/** Drietallen A/B/C roteren. */
export function rotateABC(work: number, sw: number, rounds: number, o: StructureOpts = {}) {
  return structure(
    rounds,
    [
      ["A werkt", "work", work],
      ["Wissel", "switch", sw],
      ["B werkt", "work", work],
      ["Wissel", "switch", sw],
      ["C werkt", "work", work],
      ["Wissel", "switch", sw],
    ],
    o,
  );
}

/** Klassieke werk/rust-intervallen voor iedereen tegelijk. */
export function workRest(work: number, rest: number, rounds: number, o: StructureOpts & { label?: string; text?: string } = {}) {
  const specs: IntervalSpec[] = [[o.label ?? "Werk", "work", work, o.text]];
  if (rest > 0) specs.push(["Rust", "rest", rest]);
  return structure(rounds, specs, o);
}

/** EMOM: iedere minuut een opdracht; labels per minuut, cycli = rondes. */
export function emom(cycles: number, minuteTexts: string[], o: StructureOpts & { minute?: number } = {}) {
  const len = o.minute ?? 60;
  const texts = minuteTexts.length ? minuteTexts : ["Opdracht, rest van de minuut herstel"];
  return structure(
    cycles,
    texts.map((t, i) => [texts.length > 1 ? `Min ${i + 1}` : "Minuut", "work", len, t] as IntervalSpec),
    o,
  );
}

/** Eén doorlopend interval (AMRAP, time cap, doorlopende opdracht). */
export function continuous(seconds: number, label = "Werk", o: StructureOpts & { text?: string } = {}) {
  return structure(1, [[label, "work", seconds, o.text]], o);
}

export function tabata(rounds = 8, o: StructureOpts & { text?: string } = {}) {
  return workRest(20, 10, rounds, { ...o, text: o.text });
}

/** Geeft intervallen nieuwe unieke ids (bij kopiëren naar een les). */
export function withFreshIds(s: BlockStructure): BlockStructure {
  return { ...s, intervals: s.intervals.map((i: Interval) => ({ ...i, id: newId("int") })) };
}

/** Snelkeuzes in de blokeditor. */
export const STRUCTURE_PRESETS: { id: string; label: string; build: () => BlockStructure }[] = [
  { id: "ab-25", label: "Tweetallen 25/5/25/5 × 5", build: () => partnerAB(25, 5, 5) },
  { id: "ab-20", label: "Tweetallen 20/10/20/10 × 6", build: () => partnerAB(20, 10, 6) },
  { id: "ab-40", label: "Tweetallen 40/5/40/5 × 4", build: () => partnerAB(40, 5, 4) },
  { id: "30-30", label: "30/30 × 6", build: () => workRest(30, 30, 6) },
  { id: "40-20", label: "40/20 × 6", build: () => workRest(40, 20, 6) },
  { id: "45-15", label: "45/15 × 6", build: () => workRest(45, 15, 6) },
  { id: "tabata", label: "Tabata 20/10 × 8", build: () => tabata(8) },
  { id: "emom-6", label: "EMOM 6 min (2 opdrachten)", build: () => emom(3, ["Opdracht 1", "Opdracht 2"]) },
  { id: "abc-30", label: "Drietallen 30 s rotatie × 3", build: () => rotateABC(30, 10, 3) },
  { id: "cont-5", label: "Doorlopend 5 min", build: () => continuous(300) },
];
