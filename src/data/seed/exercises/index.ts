import type { Exercise } from "@/lib/domain/types";
import {
  EQUIPMENT,
  GOALS,
  MUSCLES,
  ORGANIZATIONS,
  PHASES,
  type Equipment,
  type ExerciseCategory,
  type Goal,
  type Muscle,
  type Organization,
  type Phase,
} from "@/lib/domain/vocab";
import { normalizeSearch, slugify, uniq } from "@/lib/utils/text";
import { EXERCISE_CATALOG, FORMAT_REFERENCES } from "@/data/catalog/exercise-catalog";
import { SEED_DATE } from "../meta";
import type { ExSection, ExSeed } from "./types";
import { activate, mobilize, potentiate, raise } from "./warmup";
import { combinaties, stoten, trappen, voetenwerk } from "./technique";
import { explosief, power, speed } from "./speedpower";
import { fullbody, isometrisch, lower, upper } from "./strength";
import { cardio, cooldown, core } from "./conditioning";

const SECTIONS: ExSection[] = [
  raise, activate, mobilize, potentiate,
  stoten, trappen, voetenwerk, combinaties,
  speed, power, explosief,
  upper, lower, fullbody, isometrisch,
  cardio, core, cooldown,
];

/** Standaard lesfasen per categorie (als een oefening geen eigen fasen opgeeft). */
const CATEGORY_PHASES: Record<ExerciseCategory, Phase[]> = {
  raise: ["raise"],
  activate: ["activate"],
  mobilize: ["mobilize"],
  potentiate: ["potentiate"],
  stoten: ["bag-basics", "skills"],
  trappen: ["bag-basics", "skills"],
  voetenwerk: ["bag-basics", "skills"],
  combinaties: ["bag-basics", "skills"],
  speed: ["speed-power"],
  power: ["speed-power"],
  explosief: ["speed-power", "sc"],
  upper: ["sc"],
  lower: ["sc"],
  fullbody: ["sc", "cardio"],
  isometrisch: ["sc"],
  cardio: ["cardio", "finisher"],
  core: ["core"],
  cooldown: ["cooldown", "recovery"],
};

/** Standaard trainingsdoelen per categorie (als een oefening geen eigen doelen opgeeft). */
const CATEGORY_GOALS: Record<ExerciseCategory, Goal[]> = {
  raise: ["conditie", "coordinatie"],
  activate: ["kracht", "coordinatie"],
  mobilize: ["mobiliteit"],
  potentiate: ["snelheid", "explosiviteit"],
  stoten: ["techniek", "coordinatie"],
  trappen: ["techniek", "coordinatie"],
  voetenwerk: ["techniek", "coordinatie"],
  combinaties: ["techniek", "coordinatie"],
  speed: ["snelheid"],
  power: ["explosiviteit", "kracht"],
  explosief: ["explosiviteit"],
  upper: ["kracht", "spieruithouding"],
  lower: ["kracht", "spieruithouding"],
  fullbody: ["fullbody", "conditie"],
  isometrisch: ["spieruithouding"],
  cardio: ["conditie"],
  core: ["kracht", "spieruithouding"],
  cooldown: ["herstel", "mobiliteit"],
};

/** Problemen die tijdens het bouwen zijn gevonden; een test eist dat deze lijst leeg is. */
export const exerciseSeedIssues: string[] = [];

const valid = {
  muscle: new Set<string>(MUSCLES.map((x) => x.id)),
  goal: new Set<string>(GOALS.map((x) => x.id)),
  equipment: new Set<string>(EQUIPMENT.map((x) => x.id)),
  org: new Set<string>(ORGANIZATIONS.map((x) => x.id)),
  phase: new Set<string>(PHASES.map((x) => x.id)),
};

function list<T extends string>(value: string | undefined, kind: keyof typeof valid, where: string): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((x) => x.trim())
    .filter((x) => {
      if (!x) return false;
      if (!valid[kind].has(x)) {
        exerciseSeedIssues.push(`${where}: onbekende ${kind} "${x}"`);
        return false;
      }
      return true;
    }) as T[];
}

export const exerciseId = (name: string) => `ex-${slugify(name)}`;

function build(): Exercise[] {
  const out: Exercise[] = [];
  const explicitPhases = new Map<string, boolean>();
  const explicitGoals = new Map<string, boolean>();
  const byId = new Map<string, Exercise>();

  for (const sec of SECTIONS) {
    for (const raw of sec.items) {
      const s: ExSeed = { ...sec.defaults, ...raw };
      const id = exerciseId(s.n);
      const where = `oefening "${s.n}"`;
      if (byId.has(id)) {
        exerciseSeedIssues.push(`${where}: dubbele id ${id}`);
        continue;
      }
      if (!s.d || !s.i) exerciseSeedIssues.push(`${where}: omschrijving of uitvoering ontbreekt`);
      if (!s.p) exerciseSeedIssues.push(`${where}: bewegingspatroon ontbreekt`);
      const ex: Exercise = {
        kind: "exercise",
        id,
        builtin: true,
        origin: "gangbaar",
        sourceNote: "FightLab basisbibliotheek",
        name: s.n,
        aliases: s.aka?.length ? s.aka : undefined,
        description: s.d,
        instructions: s.i,
        category: sec.cat,
        categories: [sec.cat],
        tags: s.tags ? s.tags.split(",").map((t) => t.trim()) : [],
        goals: list<Goal>(s.g, "goal", where),
        musclesPrimary: list<Muscle>(s.m, "muscle", where),
        musclesSecondary: list<Muscle>(s.m2, "muscle", where),
        pattern: s.p ?? "core",
        equipment: list<Equipment>(s.eq, "equipment", where),
        gloves: s.gl ?? "beide",
        durationSec: s.t ?? [20, 40],
        reps: s.reps || undefined,
        rpe: s.r ?? [4, 6],
        difficulty: s.lvl ?? 1,
        phases: list<Phase>(s.ph, "phase", where),
        organization: list<Organization>(s.org, "org", where),
        cues: s.c ?? [],
        mistakes: s.f ?? [],
        safety: s.s,
        easier: s.e,
        harder: s.h,
        progression: s.pr,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      };
      explicitPhases.set(id, Boolean(raw.ph));
      explicitGoals.set(id, Boolean(raw.g));
      byId.set(id, ex);
      out.push(ex);
    }
  }

  // Naam/alias-index en catalogusindeling.
  const index = new Map<string, Exercise>();
  for (const ex of out) {
    for (const n of [ex.name, ...(ex.aliases ?? [])]) {
      const key = normalizeSearch(n);
      const prev = index.get(key);
      if (prev && prev.id !== ex.id) exerciseSeedIssues.push(`naam/alias "${n}" botst tussen ${prev.id} en ${ex.id}`);
      index.set(key, ex);
    }
  }
  for (const [cat, names] of Object.entries(EXERCISE_CATALOG) as [ExerciseCategory, string[]][]) {
    for (const name of names) {
      if (FORMAT_REFERENCES.includes(name)) continue;
      const ex = index.get(normalizeSearch(name));
      if (!ex) {
        exerciseSeedIssues.push(`catalogus ${cat}: "${name}" niet gevonden`);
        continue;
      }
      if (!ex.categories.includes(cat)) ex.categories.push(cat);
    }
  }

  // Afgeleide velden.
  for (const ex of out) {
    if (!explicitPhases.get(ex.id) && ex.phases.length === 0) {
      ex.phases = uniq(ex.categories.flatMap((c) => CATEGORY_PHASES[c]));
    }
    if (!explicitGoals.get(ex.id) && ex.goals.length === 0) ex.goals = uniq(ex.categories.flatMap((c) => CATEGORY_GOALS[c]));
    if (ex.organization.length === 0) ex.organization = ["individueel"];
    if (ex.equipment.length === 0) ex.equipment = ["lichaamsgewicht"];
  }
  return out;
}

export const SEED_EXERCISES: Exercise[] = build();

const nameIndex = new Map<string, string>();
for (const ex of SEED_EXERCISES) {
  for (const n of [ex.name, ...(ex.aliases ?? [])]) nameIndex.set(normalizeSearch(n), ex.id);
}

/** Zoekt een ingebouwde oefening op naam of alias (voor seeddata van formats/blokken/lessen). */
export function seedExerciseIdByName(name: string): string | undefined {
  return nameIndex.get(normalizeSearch(name));
}
