import type { Exercise, Format, LessonTemplate, LibraryItem, LibraryKind, TrainingBlock, UserData } from "@/lib/domain/types";
import { SEED_BLOCKS, SEED_EXERCISES, SEED_FORMATS, SEED_TEMPLATES } from "@/data/seed";

/**
 * De bibliotheek = ingebouwde seed + eigen items + eigen aanpassingen (overrides).
 * Een override heeft dezelfde id als het seed-item en vervangt het in de weergave.
 * Seed-updates in de code overschrijven dus nooit wat de gebruiker heeft aangepast.
 * Verborgen ingebouwde items staan in `hidden` ("kind:id").
 */
export interface Library {
  exercises: Exercise[];
  formats: Format[];
  blocks: TrainingBlock[];
  templates: LessonTemplate[];
  exercise: Map<string, Exercise>;
  format: Map<string, Format>;
  block: Map<string, TrainingBlock>;
  template: Map<string, LessonTemplate>;
  /** Ingebouwde items met een eigen aanpassing. */
  modified: Set<string>;
}

export const SEED_IDS = {
  exercise: new Set(SEED_EXERCISES.map((x) => x.id)),
  format: new Set(SEED_FORMATS.map((x) => x.id)),
  block: new Set(SEED_BLOCKS.map((x) => x.id)),
  template: new Set(SEED_TEMPLATES.map((x) => x.id)),
};

export const SEED_BY_KIND = {
  exercise: new Map(SEED_EXERCISES.map((x) => [x.id, x])),
  format: new Map(SEED_FORMATS.map((x) => [x.id, x])),
  block: new Map(SEED_BLOCKS.map((x) => [x.id, x])),
  template: new Map(SEED_TEMPLATES.map((x) => [x.id, x])),
} as const;

const collator = new Intl.Collator("nl", { sensitivity: "base", numeric: true });
const nameOf = (x: LibraryItem) => ("name" in x ? x.name : x.title);

function merge<T extends LibraryItem>(seed: T[], user: Record<string, T>, hidden: Set<string>, kind: LibraryKind, modified: Set<string>): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const s of seed) {
    seen.add(s.id);
    if (hidden.has(`${kind}:${s.id}`)) continue;
    const o = user[s.id];
    if (o) {
      modified.add(`${kind}:${s.id}`);
      out.push({ ...o, builtin: true });
    } else out.push(s);
  }
  for (const [id, item] of Object.entries(user)) if (!seen.has(id)) out.push(item);
  return out.sort((a, b) => collator.compare(nameOf(a), nameOf(b)));
}

export function mergeLibrary(user: Pick<UserData, "exercises" | "formats" | "blocks" | "templates" | "hidden">): Library {
  const hidden = new Set(user.hidden);
  const modified = new Set<string>();
  const exercises = merge(SEED_EXERCISES, user.exercises, hidden, "exercise", modified);
  const formats = merge(SEED_FORMATS, user.formats, hidden, "format", modified);
  const blocks = merge(SEED_BLOCKS, user.blocks, hidden, "block", modified);
  // Lesstructuren in vaste volgorde houden (seedvolgorde), eigen structuren daarna.
  const templates = [...SEED_TEMPLATES.filter((t) => !hidden.has(`template:${t.id}`)).map((t) => {
    const o = user.templates[t.id];
    if (o) modified.add(`template:${t.id}`);
    return o ? { ...o, builtin: true } : t;
  }), ...Object.values(user.templates).filter((t) => !SEED_IDS.template.has(t.id))];
  return {
    exercises,
    formats,
    blocks,
    templates,
    exercise: new Map(exercises.map((x) => [x.id, x])),
    format: new Map(formats.map((x) => [x.id, x])),
    block: new Map(blocks.map((x) => [x.id, x])),
    template: new Map(templates.map((x) => [x.id, x])),
    modified,
  };
}

export function itemName(item: LibraryItem): string {
  return nameOf(item);
}

export function isSeedId(kind: LibraryKind, id: string): boolean {
  return SEED_IDS[kind].has(id);
}

export function favKey(kind: LibraryKind, id: string) {
  return `${kind}:${id}`;
}
