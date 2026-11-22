"use client";

import { create } from "zustand";
import type {
  Evaluation,
  Exercise,
  Format,
  Lesson,
  LessonBlock,
  LessonTemplate,
  LibraryItem,
  LibraryKind,
  Preferences,
  TrainingBlock,
  UserData,
} from "@/lib/domain/types";
import { nowIso, newId } from "@/lib/utils/id";
import { mergeLibrary, isSeedId, SEED_BY_KIND, type Library } from "@/lib/data/library";
import { duplicateBlock, duplicateLesson, markGiven, moveItem } from "@/lib/data/lesson-ops";
import { normalizeUserData, saveLocal, loadLocal, loadOutbox, saveOutbox, type Entity, type Op, type Outbox } from "./persistence";

export type SyncStatus = "local" | "idle" | "saving" | "saved" | "offline" | "error";

export interface SyncInfo {
  /** local = demo-modus of niet ingelogd; cloud = Supabase actief. */
  mode: "local" | "cloud";
  status: SyncStatus;
  configured: boolean;
  email?: string;
  userId?: string;
  error?: string;
  lastSyncedAt?: string;
  pending: number;
}

type MapKey = "exercises" | "formats" | "blocks" | "templates";
const MAP: Record<LibraryKind, MapKey> = { exercise: "exercises", format: "formats", block: "blocks", template: "templates" };

export interface FightLabState {
  ready: boolean;
  data: UserData;
  sync: SyncInfo;

  hydrate(): void;
  replaceData(data: UserData, opts?: { markAllDirty?: boolean }): void;
  setSync(patch: Partial<SyncInfo>): void;

  // Bibliotheek
  saveItem(item: LibraryItem): void;
  deleteItem(kind: LibraryKind, id: string): { restore: () => void } | null;
  resetItem(kind: LibraryKind, id: string): void;
  unhide(keys?: string[]): void;
  duplicateItem(kind: LibraryKind, id: string): LibraryItem | null;
  toggleFavorite(kind: LibraryKind, id: string): void;
  touchRecent(kind: LibraryKind, id: string): void;

  // Lessen
  createLesson(lesson: Lesson, activate?: boolean): string;
  updateLesson(id: string, fn: (l: Lesson) => Lesson): void;
  updateBlock(lessonId: string, blockId: string, fn: (b: LessonBlock) => LessonBlock): void;
  addBlocks(lessonId: string, blocks: LessonBlock[], index?: number): void;
  removeBlock(lessonId: string, blockId: string): { restore: () => void } | null;
  moveBlock(lessonId: string, from: number, to: number): void;
  duplicateBlockInLesson(lessonId: string, blockId: string): string | null;
  duplicateLessonById(id: string): string | null;
  deleteLesson(id: string): { restore: () => void } | null;
  restoreLesson(id: string): void;
  purgeLesson(id: string): void;
  markLessonGiven(id: string, evaluation: Evaluation): void;
  setActiveLesson(id: string | undefined): void;

  updatePrefs(patch: Partial<Preferences>): void;
}

// ——— Outbox & autosave ———
let outbox: Outbox = {};
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
type FlushListener = () => void;
const flushListeners = new Set<FlushListener>();

/** Wordt aangeroepen als er wijzigingen klaarstaan voor de server (sync-engine luistert). */
export function onOutboxChange(fn: FlushListener) {
  flushListeners.add(fn);
  return () => flushListeners.delete(fn);
}

export function getOutbox(): Outbox {
  return outbox;
}

export function clearOutboxEntries(entries: { key: string; v: number }[]) {
  for (const e of entries) if (outbox[e.key]?.v === e.v) delete outbox[e.key];
  saveOutbox(outbox);
  useStore.getState().setSync({ pending: Object.keys(outbox).length });
}

export function resetOutbox() {
  outbox = {};
  saveOutbox(outbox);
}

function mark(entity: Entity, id: string, op: Op) {
  version += 1;
  outbox[`${entity}:${id}`] = { entity, id, op, v: version };
}

/** Schrijft direct naar localStorage (o.a. bij verlaten van de pagina). */
export function flushLocalSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveLocal(useStore.getState().data);
  saveOutbox(outbox);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushLocalSave, 250);
}

function touch<T extends { updatedAt: string }>(x: T): T {
  return { ...x, updatedAt: nowIso() };
}

// ——— Bibliotheek-memo ———
let libCache: { key: unknown[]; lib: Library } | null = null;
export function selectLibrary(d: UserData): Library {
  const key = [d.exercises, d.formats, d.blocks, d.templates, d.hidden];
  if (libCache && libCache.key.every((k, i) => k === key[i])) return libCache.lib;
  const lib = mergeLibrary(d);
  libCache = { key, lib };
  return lib;
}

export const useStore = create<FightLabState>()((set, get) => {
  /** Centrale mutatie: nieuwe data + outbox + autosave. */
  function commit(next: UserData, changes: [Entity, string, Op][]) {
    for (const [e, id, op] of changes) mark(e, id, op);
    set((s) => ({ data: next, sync: { ...s.sync, pending: Object.keys(outbox).length } }));
    scheduleSave();
    if (changes.length) flushListeners.forEach((fn) => fn());
  }

  function getLibraryItem(kind: LibraryKind, id: string): LibraryItem | undefined {
    const d = get().data;
    const own = d[MAP[kind]][id] as LibraryItem | undefined;
    return own ?? (SEED_BY_KIND[kind].get(id) as LibraryItem | undefined);
  }

  function setLesson(l: Lesson) {
    const d = get().data;
    commit({ ...d, lessons: { ...d.lessons, [l.id]: touch(l) } }, [["lesson", l.id, "upsert"]]);
  }

  return {
    ready: false,
    data: normalizeUserData(null),
    sync: { mode: "local", status: "local", configured: false, pending: 0 },

    hydrate() {
      if (get().ready) return;
      const { data, fresh } = loadLocal();
      outbox = loadOutbox();
      version = Math.max(0, ...Object.values(outbox).map((e) => e.v));
      if (fresh) for (const id of Object.keys(data.lessons)) mark("lesson", id, "upsert");
      set((s) => ({ ready: true, data, sync: { ...s.sync, pending: Object.keys(outbox).length } }));
      if (fresh) scheduleSave();
    },

    replaceData(data, opts) {
      const next = normalizeUserData(data);
      if (opts?.markAllDirty) {
        for (const id of Object.keys(next.exercises)) mark("exercise", id, "upsert");
        for (const id of Object.keys(next.formats)) mark("format", id, "upsert");
        for (const id of Object.keys(next.blocks)) mark("block", id, "upsert");
        for (const id of Object.keys(next.templates)) mark("template", id, "upsert");
        for (const id of Object.keys(next.lessons)) mark("lesson", id, "upsert");
        for (const f of next.favorites) mark("favorite", f, "upsert");
        mark("prefs", "me", "upsert");
      }
      set((s) => ({ data: next, sync: { ...s.sync, pending: Object.keys(outbox).length } }));
      scheduleSave();
      if (opts?.markAllDirty) flushListeners.forEach((fn) => fn());
    },

    setSync(patch) {
      set((s) => ({ sync: { ...s.sync, ...patch } }));
    },

    saveItem(item) {
      const d = get().data;
      const key = MAP[item.kind];
      const saved = touch(item) as LibraryItem;
      commit({ ...d, [key]: { ...d[key], [item.id]: saved } }, [[item.kind, item.id, "upsert"]]);
    },

    deleteItem(kind, id) {
      const d = get().data;
      const key = MAP[kind];
      const own = d[key][id] as LibraryItem | undefined;
      const fav = `${kind}:${id}`;
      const wasFav = d.favorites.includes(fav);
      if (isSeedId(kind, id)) {
        const map = { ...d[key] };
        delete map[id];
        const hidden = d.hidden.includes(fav) ? d.hidden : [...d.hidden, fav];
        const changes: [Entity, string, Op][] = [["prefs", "me", "upsert"]];
        if (own) changes.push([kind, id, "delete"]);
        if (wasFav) changes.push(["favorite", fav, "delete"]);
        commit({ ...d, [key]: map, hidden, favorites: d.favorites.filter((f) => f !== fav) }, changes);
      } else {
        if (!own) return null;
        const map = { ...d[key] };
        delete map[id];
        const changes: [Entity, string, Op][] = [[kind, id, "delete"]];
        if (wasFav) changes.push(["favorite", fav, "delete"]);
        commit({ ...d, [key]: map, favorites: d.favorites.filter((f) => f !== fav) }, changes);
      }
      return {
        restore: () => {
          const cur = get().data;
          const changes: [Entity, string, Op][] = [["prefs", "me", "upsert"]];
          const map = { ...cur[key] };
          if (own) {
            map[id] = own as never;
            changes.push([kind, id, "upsert"]);
          }
          const favorites = wasFav && !cur.favorites.includes(fav) ? [...cur.favorites, fav] : cur.favorites;
          if (wasFav) changes.push(["favorite", fav, "upsert"]);
          commit({ ...cur, [key]: map, hidden: cur.hidden.filter((h) => h !== fav), favorites }, changes);
        },
      };
    },

    resetItem(kind, id) {
      const d = get().data;
      const key = MAP[kind];
      if (!isSeedId(kind, id) || !d[key][id]) return;
      const map = { ...d[key] };
      delete map[id];
      commit({ ...d, [key]: map }, [[kind, id, "delete"]]);
    },

    unhide(keys) {
      const d = get().data;
      const hidden = keys ? d.hidden.filter((h) => !keys.includes(h)) : [];
      commit({ ...d, hidden }, [["prefs", "me", "upsert"]]);
    },

    duplicateItem(kind, id) {
      const src = getLibraryItem(kind, id);
      if (!src) return null;
      const now = nowIso();
      const prefix = { exercise: "ex", format: "fmt", block: "blk", template: "tpl" }[kind];
      const copy = structuredClone(src) as LibraryItem;
      copy.id = newId(prefix);
      copy.builtin = false;
      copy.origin = "eigen";
      copy.basedOn = src.id;
      copy.createdAt = now;
      copy.updatedAt = now;
      if ("name" in copy) copy.name = `${copy.name} (kopie)`;
      else copy.title = `${copy.title} (kopie)`;
      if (copy.kind === "template") copy.slots = copy.slots.map((s) => ({ ...s, id: newId("slot") }));
      get().saveItem(copy);
      return copy;
    },

    toggleFavorite(kind, id) {
      const d = get().data;
      const k = `${kind}:${id}`;
      const on = d.favorites.includes(k);
      commit({ ...d, favorites: on ? d.favorites.filter((f) => f !== k) : [...d.favorites, k] }, [["favorite", k, on ? "delete" : "upsert"]]);
    },

    touchRecent(kind, id) {
      const d = get().data;
      const recent = [{ kind, id, at: nowIso() }, ...d.recent.filter((r) => !(r.kind === kind && r.id === id))].slice(0, 20);
      commit({ ...d, recent }, [["prefs", "me", "upsert"]]);
    },

    createLesson(lesson, activate = true) {
      const d = get().data;
      const l = touch(lesson);
      const prefs = activate ? { ...d.prefs, activeLessonId: l.id } : d.prefs;
      const changes: [Entity, string, Op][] = [["lesson", l.id, "upsert"]];
      if (activate) changes.push(["prefs", "me", "upsert"]);
      commit({ ...d, lessons: { ...d.lessons, [l.id]: l }, prefs }, changes);
      return l.id;
    },

    updateLesson(id, fn) {
      const l = get().data.lessons[id];
      if (l) setLesson(fn(l));
    },

    updateBlock(lessonId, blockId, fn) {
      get().updateLesson(lessonId, (l) => ({ ...l, blocks: l.blocks.map((b) => (b.id === blockId ? fn(b) : b)) }));
    },

    addBlocks(lessonId, blocks, index) {
      get().updateLesson(lessonId, (l) => {
        const at = index === undefined ? l.blocks.length : Math.max(0, Math.min(index, l.blocks.length));
        return { ...l, blocks: [...l.blocks.slice(0, at), ...blocks, ...l.blocks.slice(at)] };
      });
    },

    removeBlock(lessonId, blockId) {
      const l = get().data.lessons[lessonId];
      if (!l) return null;
      const index = l.blocks.findIndex((b) => b.id === blockId);
      if (index < 0) return null;
      const block = l.blocks[index];
      get().updateLesson(lessonId, (x) => ({ ...x, blocks: x.blocks.filter((b) => b.id !== blockId) }));
      return { restore: () => get().addBlocks(lessonId, [block], index) };
    },

    moveBlock(lessonId, from, to) {
      get().updateLesson(lessonId, (l) => ({ ...l, blocks: moveItem(l.blocks, from, to) }));
    },

    duplicateBlockInLesson(lessonId, blockId) {
      const l = get().data.lessons[lessonId];
      const index = l?.blocks.findIndex((b) => b.id === blockId) ?? -1;
      if (!l || index < 0) return null;
      const copy = duplicateBlock(l.blocks[index]);
      get().addBlocks(lessonId, [copy], index + 1);
      return copy.id;
    },

    duplicateLessonById(id) {
      const l = get().data.lessons[id];
      if (!l) return null;
      return get().createLesson(duplicateLesson(l), true);
    },

    deleteLesson(id) {
      const l = get().data.lessons[id];
      if (!l) return null;
      const d = get().data;
      const prefs = d.prefs.activeLessonId === id ? { ...d.prefs, activeLessonId: undefined } : d.prefs;
      commit({ ...d, prefs, lessons: { ...d.lessons, [id]: touch({ ...l, deletedAt: nowIso() }) } }, [["lesson", id, "upsert"], ["prefs", "me", "upsert"]]);
      return { restore: () => get().restoreLesson(id) };
    },

    restoreLesson(id) {
      get().updateLesson(id, (l) => ({ ...l, deletedAt: undefined }));
    },

    purgeLesson(id) {
      const d = get().data;
      if (!d.lessons[id]) return;
      const lessons = { ...d.lessons };
      delete lessons[id];
      commit({ ...d, lessons }, [["lesson", id, "delete"]]);
    },

    markLessonGiven(id, evaluation) {
      get().updateLesson(id, (l) => markGiven(l, evaluation));
    },

    setActiveLesson(id) {
      const d = get().data;
      if (d.prefs.activeLessonId === id) return;
      commit({ ...d, prefs: { ...d.prefs, activeLessonId: id } }, [["prefs", "me", "upsert"]]);
    },

    updatePrefs(patch) {
      const d = get().data;
      commit({ ...d, prefs: { ...d.prefs, ...patch } }, [["prefs", "me", "upsert"]]);
    },
  };
});

// ——— Hooks ———
export function useLibrary(): Library {
  const d = useStore((s) => s.data);
  return selectLibrary(d);
}

export function useActiveLesson(): Lesson | undefined {
  return useStore((s) => {
    const id = s.data.prefs.activeLessonId;
    const l = id ? s.data.lessons[id] : undefined;
    return l && !l.deletedAt ? l : undefined;
  });
}

export function useIsFavorite(kind: LibraryKind, id: string) {
  return useStore((s) => s.data.favorites.includes(`${kind}:${id}`));
}

export type { Exercise, Format, TrainingBlock, LessonTemplate };
