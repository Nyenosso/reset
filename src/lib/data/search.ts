import type { Exercise, Format, LessonTemplate, TrainingBlock } from "@/lib/domain/types";
import {
  categoryLabel,
  equipmentLabel,
  formatSectionLabel,
  goalLabel,
  muscleLabel,
  organizationLabel,
  patternLabel,
  phaseLabel,
  type Equipment,
  type ExerciseCategory,
  type FormatSection,
  type GloveFit,
  type Goal,
  type Level,
  type Muscle,
  type Organization,
  type Origin,
  type Phase,
} from "@/lib/domain/vocab";
import { normalizeSearch, searchTokens } from "@/lib/utils/text";
import { structureSeconds } from "@/lib/time/structure";

interface Haystack {
  name: string;
  alias: string;
  meta: string;
  body: string;
}

const cache = new WeakMap<object, Haystack>();

function hay(item: Exercise | Format | TrainingBlock | LessonTemplate): Haystack {
  const hit = cache.get(item);
  if (hit) return hit;
  let h: Haystack;
  switch (item.kind) {
    case "exercise":
      h = {
        name: normalizeSearch(item.name),
        alias: normalizeSearch((item.aliases ?? []).join(" | ")),
        meta: normalizeSearch(
          [
            ...item.categories.map(categoryLabel),
            ...item.tags,
            ...item.goals.map(goalLabel),
            ...item.musclesPrimary.map(muscleLabel),
            patternLabel(item.pattern),
            ...item.equipment.map(equipmentLabel),
          ].join(" | "),
        ),
        body: normalizeSearch([item.description, item.instructions, item.easier, item.harder, item.notes].filter(Boolean).join(" | ")),
      };
      break;
    case "format":
      h = {
        name: normalizeSearch(item.name),
        alias: normalizeSearch((item.aliases ?? []).join(" | ")),
        meta: normalizeSearch([formatSectionLabel(item.section), goalLabel(item.mainGoal), ...item.goals.map(goalLabel), ...item.phases.map(phaseLabel), ...item.organization.map(organizationLabel)].join(" | ")),
        body: normalizeSearch([item.description, item.rule, item.example, item.notes].filter(Boolean).join(" | ")),
      };
      break;
    case "block":
      h = {
        name: normalizeSearch(item.title),
        alias: normalizeSearch(item.formatName ?? ""),
        meta: normalizeSearch([phaseLabel(item.phase), ...item.goals.map(goalLabel), ...item.tags, organizationLabel(item.organization), ...item.exercises.map((e) => e.name)].join(" | ")),
        body: normalizeSearch([item.description, item.instructions].join(" | ")),
      };
      break;
    case "template":
      h = {
        name: normalizeSearch(item.name),
        alias: "",
        meta: normalizeSearch([...item.focus.map(goalLabel), ...item.slots.map((s) => s.title)].join(" | ")),
        body: normalizeSearch(item.description),
      };
      break;
  }
  cache.set(item, h);
  return h;
}

/** Relevantiescore; 0 = geen match. Alle zoekwoorden moeten ergens voorkomen. */
export function matchScore(item: Exercise | Format | TrainingBlock | LessonTemplate, query: string): number {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return 1;
  const h = hay(item);
  const full = normalizeSearch(query);
  let score = 0;
  const aliases = h.alias ? h.alias.split(" | ") : [];
  if (h.name === full) score += 200;
  else if (aliases.includes(full)) score += 190;
  else if (h.name.startsWith(full)) score += 120;
  else if (h.name.includes(full)) score += 80;
  else if (aliases.some((a) => a.startsWith(full))) score += 60;
  // Kortere (basis)namen iets hoger bij gelijke relevantie.
  score += Math.max(0, 12 - Math.floor(Math.max(0, h.name.length - full.length) / 2));
  for (const t of tokens) {
    if (h.name.includes(t)) score += h.name.split(/[\s-]+/).some((w) => w.startsWith(t)) ? 40 : 30;
    else if (h.alias.includes(t)) score += 25;
    else if (h.meta.includes(t)) score += 12;
    else if (h.body.includes(t)) score += 5;
    else return 0;
  }
  return score;
}

export function searchItems<T extends Exercise | Format | TrainingBlock | LessonTemplate>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const s = matchScore(item, query);
    if (s > 0) scored.push({ item, score: s });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.item);
}

const any = <T,>(selected: T[] | undefined, values: T[]) => !selected || selected.length === 0 || selected.some((s) => values.includes(s));
const overlaps = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];

export interface ExerciseFilters {
  categories?: ExerciseCategory[];
  phases?: Phase[];
  goals?: Goal[];
  equipment?: Equipment[];
  gloves?: GloveFit[];
  difficulty?: Level[];
  muscles?: Muscle[];
  organization?: Organization[];
  onlyAvailable?: Equipment[];
}

export function filterExercises(list: Exercise[], f: ExerciseFilters): Exercise[] {
  return list.filter(
    (e) =>
      any(f.categories, e.categories) &&
      any(f.phases, e.phases) &&
      any(f.goals, e.goals) &&
      any(f.equipment, e.equipment) &&
      (!f.gloves?.length || f.gloves.includes(e.gloves) || e.gloves === "beide") &&
      any(f.difficulty, [e.difficulty]) &&
      any(f.muscles, [...e.musclesPrimary, ...e.musclesSecondary]) &&
      any(f.organization, e.organization) &&
      (!f.onlyAvailable || exerciseFitsEquipment(e, f.onlyAvailable)),
  );
}

/** Oefeningmateriaal is een lijst alternatieven: één beschikbaar item volstaat. */
export function exerciseFitsEquipment(e: Exercise, available: Equipment[]): boolean {
  return e.equipment.some((q) => q === "lichaamsgewicht" || available.includes(q));
}

export interface FormatFilters {
  sections?: FormatSection[];
  phases?: Phase[];
  goals?: Goal[];
  organization?: Organization[];
  equipment?: Equipment[];
  origins?: Origin[];
  rpe?: [number, number];
  duration?: [number, number];
  logistics?: Level[];
}

export function filterFormats(list: Format[], f: FormatFilters): Format[] {
  return list.filter(
    (x) =>
      any(f.sections, [x.section]) &&
      any(f.phases, x.phases) &&
      any(f.goals, [x.mainGoal, ...x.goals]) &&
      any(f.organization, x.organization) &&
      any(f.equipment, x.equipment) &&
      any(f.origins, [x.origin]) &&
      any(f.logistics, [x.logistics]) &&
      (!f.rpe || overlaps(f.rpe, x.rpe)) &&
      (!f.duration || overlaps(f.duration, x.durationSec)),
  );
}

export interface BlockFilters {
  phases?: Phase[];
  goals?: Goal[];
  organization?: Organization[];
  duration?: [number, number];
}

export function filterBlocks(list: TrainingBlock[], f: BlockFilters): TrainingBlock[] {
  return list.filter((b) => {
    const sec = b.durationMode === "auto" && b.structure ? structureSeconds(b.structure) : b.durationSec;
    return any(f.phases, [b.phase]) && any(f.goals, b.goals) && any(f.organization, [b.organization]) && (!f.duration || (sec >= f.duration[0] && sec <= f.duration[1]));
  });
}

export function countActiveFilters(f: object): number {
  return Object.values(f).filter((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== false)).length;
}
