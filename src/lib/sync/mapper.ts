import type { Exercise, Format, Lesson, LessonBlock, LessonTemplate, Preferences, RecentItem, TrainingBlock, UserData } from "@/lib/domain/types";
import { isSeedId } from "@/lib/data/library";
import { blockSeconds } from "@/lib/time/structure";
import { withPrefDefaults } from "@/lib/data/defaults";

/**
 * Omzetting tussen FightLab-objecten en databaserijen (zie supabase/migrations).
 * Kolommen voor zoeken/sorteren staan los; het volledige object staat in `data` (jsonb).
 */
type Row = Record<string, unknown>;

export function exerciseRows(e: Exercise, userId: string) {
  const row: Row = {
    user_id: userId, id: e.id, builtin_id: isSeedId("exercise", e.id) ? e.id : null,
    name: e.name, category: e.category, description: e.description, tags: e.tags,
    data: e, created_at: e.createdAt, updated_at: e.updatedAt,
  };
  const relations = (e.relations ?? []).map((r) => ({ user_id: userId, exercise_id: e.id, related_id: r.id, kind: r.kind }));
  return { row, relations };
}

export function exerciseFromRows(row: Row, relations: Row[]): Exercise {
  const e = row.data as Exercise;
  const rel = relations.filter((r) => r.exercise_id === row.id).map((r) => ({ kind: r.kind as "easier" | "harder" | "variation", id: String(r.related_id) }));
  return { ...e, id: String(row.id), relations: rel.length ? rel : e.relations };
}

export function formatRow(f: Format, userId: string): Row {
  return { user_id: userId, id: f.id, builtin_id: isSeedId("format", f.id) ? f.id : null, name: f.name, section: f.section, description: f.description, data: f, created_at: f.createdAt, updated_at: f.updatedAt };
}

export function formatFromRow(row: Row): Format {
  return { ...(row.data as Format), id: String(row.id) };
}

export function trainingBlockRows(b: TrainingBlock, userId: string) {
  const { exercises, ...rest } = b;
  const row: Row = {
    user_id: userId, id: b.id, builtin_id: isSeedId("block", b.id) ? b.id : null, title: b.title, phase: b.phase,
    format_id: b.formatId ?? null, duration_sec: blockSeconds(b), data: rest, created_at: b.createdAt, updated_at: b.updatedAt,
  };
  const items = exercises.map((e, position) => ({
    user_id: userId, block_id: b.id, id: e.id, position, exercise_id: e.exerciseId ?? null, name: e.name,
    tag: e.tag ?? null, amount: e.amount ?? null, note: e.note ?? null,
  }));
  return { row, items };
}

export function trainingBlockFromRows(row: Row, items: Row[]): TrainingBlock {
  const rest = row.data as Omit<TrainingBlock, "exercises">;
  const exercises = items
    .filter((i) => i.block_id === row.id)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((i) => ({
      id: String(i.id),
      name: String(i.name),
      ...(i.exercise_id ? { exerciseId: String(i.exercise_id) } : {}),
      ...(i.tag ? { tag: String(i.tag) } : {}),
      ...(i.amount ? { amount: String(i.amount) } : {}),
      ...(i.note ? { note: String(i.note) } : {}),
    }));
  return { ...rest, id: String(row.id), exercises } as TrainingBlock;
}

export function templateRow(t: LessonTemplate, userId: string): Row {
  return { user_id: userId, id: t.id, builtin_id: isSeedId("template", t.id) ? t.id : null, name: t.name, description: t.description, slots: t.slots, data: t, created_at: t.createdAt, updated_at: t.updatedAt };
}

export function templateFromRow(row: Row): LessonTemplate {
  return { ...(row.data as LessonTemplate), id: String(row.id), slots: (row.slots as LessonTemplate["slots"]) ?? (row.data as LessonTemplate).slots };
}

export function lessonRows(l: Lesson, userId: string) {
  const { blocks, ...rest } = l;
  const row: Row = {
    user_id: userId, id: l.id, title: l.title, lesson_date: l.date || null, status: l.status, target_sec: l.targetSec,
    participants: l.participants, favorite: l.favorite, deleted_at: l.deletedAt ?? null, data: rest,
    created_at: l.createdAt, updated_at: l.updatedAt,
  };
  const blockRows = blocks.map((b, position) => ({
    user_id: userId, id: b.id, lesson_id: l.id, position, source_block_id: b.sourceBlockId ?? null,
    title: b.title, phase: b.phase, duration_sec: blockSeconds(b), data: b, updated_at: l.updatedAt,
  }));
  return { row, blocks: blockRows };
}

export function lessonFromRows(row: Row, blockRows: Row[]): Lesson {
  const rest = row.data as Omit<Lesson, "blocks">;
  const blocks = blockRows
    .filter((b) => b.lesson_id === row.id)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((b) => ({ ...(b.data as LessonBlock), id: String(b.id) }));
  return { ...rest, id: String(row.id), deletedAt: (row.deleted_at as string | null) ?? undefined, blocks };
}

export function prefsRow(d: UserData, userId: string): Row {
  return { user_id: userId, data: d.prefs, hidden_items: d.hidden, recent: d.recent, updated_at: new Date().toISOString() };
}

export function prefsFromRow(row: Row | undefined): { prefs: Preferences; hidden: string[]; recent: RecentItem[] } | null {
  if (!row) return null;
  return { prefs: withPrefDefaults(row.data as Partial<Preferences>), hidden: (row.hidden_items as string[]) ?? [], recent: (row.recent as RecentItem[]) ?? [] };
}

export function favoriteRow(key: string, userId: string): Row {
  const i = key.indexOf(":");
  return { user_id: userId, item_type: key.slice(0, i), item_id: key.slice(i + 1) };
}
