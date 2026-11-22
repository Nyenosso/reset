import type { BlockContent, BlockExercise, BlockStructure } from "@/lib/domain/types";
import { EQUIPMENT, GOALS, type BlockGloves, type Equipment, type Goal, type Organization, type Phase } from "@/lib/domain/vocab";
import { structureSeconds } from "@/lib/time/structure";
import { SEED_EXERCISES, seedExerciseIdByName } from "./exercises";
import { SEED_FORMATS, seedFormatIdByName } from "./formats";

export const blockSeedIssues: string[] = [];

/**
 * Oefening in een seedblok: naam uit de bibliotheek, of vrije tekst met "~" ervoor.
 * Tuplevorm: [naam, aantal?, label?, notitie?].
 */
export type BlkEx = string | [name: string, amount?: string, tag?: string, note?: string];

export interface BlkSeed {
  title: string;
  phase: Phase;
  format?: string;
  ex: BlkEx[];
  st: BlockStructure | null;
  /** Vaste duur in seconden (alleen als er geen structuur is). */
  dur?: number;
  org: Organization;
  eq: string;
  gl: BlockGloves;
  rpe: [number, number];
  g: string;
  instr: string;
  roles?: string;
  cues?: string[];
  easy?: string;
  hard?: string;
  notes?: string;
}

const goalSet = new Set<string>(GOALS.map((g) => g.id));
const eqSet = new Set<string>(EQUIPMENT.map((e) => e.id));
const exName = new Map(SEED_EXERCISES.map((e) => [e.id, e.name]));
const fmtName = new Map(SEED_FORMATS.map((f) => [f.id, f.name]));

export function buildBlockContent(s: BlkSeed, idPrefix: string): BlockContent {
  const where = `blok "${s.title}"`;
  const exercises: BlockExercise[] = s.ex.map((raw, i) => {
    const [name, amount, tag, note] = typeof raw === "string" ? [raw] : raw;
    const id = `${idPrefix}-e${i + 1}`;
    if (name.startsWith("~")) return { id, name: name.slice(1), amount, tag, note };
    const exerciseId = seedExerciseIdByName(name);
    if (!exerciseId) blockSeedIssues.push(`${where}: oefening "${name}" niet gevonden`);
    return { id, exerciseId, name: exerciseId ? (exName.get(exerciseId) ?? name) : name, amount, tag, note };
  });
  let formatId: string | undefined;
  if (s.format) {
    formatId = seedFormatIdByName(s.format);
    if (!formatId) blockSeedIssues.push(`${where}: format "${s.format}" niet gevonden`);
  }
  const goals = s.g.split(",").map((x) => x.trim()).filter(Boolean);
  for (const g of goals) if (!goalSet.has(g)) blockSeedIssues.push(`${where}: onbekend doel ${g}`);
  const equipment = s.eq.split(",").map((x) => x.trim()).filter(Boolean);
  for (const e of equipment) if (!eqSet.has(e)) blockSeedIssues.push(`${where}: onbekend materiaal ${e}`);
  const structure = s.st ? { ...s.st, intervals: s.st.intervals.map((iv, i) => ({ ...iv, id: `${idPrefix}-i${i + 1}` })) } : null;
  if (!structure && !s.dur) blockSeedIssues.push(`${where}: geen structuur en geen duur`);
  return {
    title: s.title,
    phase: s.phase,
    formatId,
    formatName: formatId ? fmtName.get(formatId) : undefined,
    exercises,
    structure,
    durationMode: structure ? "auto" : "manual",
    durationSec: structure ? structureSeconds(structure) : (s.dur ?? 0),
    organization: s.org,
    equipment: equipment as Equipment[],
    gloves: s.gl,
    rpe: s.rpe,
    goals: goals as Goal[],
    instructions: s.instr,
    partnerRoles: s.roles ?? "",
    cues: s.cues ?? [],
    easier: s.easy ?? "",
    harder: s.hard ?? "",
    notes: s.notes ?? "",
  };
}
