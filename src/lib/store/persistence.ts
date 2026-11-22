import type { UserData } from "@/lib/domain/types";
import { emptyUserData, withPrefDefaults } from "@/lib/data/defaults";
import { SEED_LESSONS } from "@/data/seed";

/**
 * Lokale opslag (localStorage). Altijd actief als snelle cache; in demo-modus
 * de enige opslag. Alle toegang is beschermd met try/catch (privémodus, quota).
 */
const DATA_KEY = "fightlab:data:v1";
const OUTBOX_KEY = "fightlab:outbox:v1";
const META_KEY = "fightlab:meta:v1";

export type Entity = "exercise" | "format" | "block" | "template" | "lesson" | "favorite" | "prefs";
export type Op = "upsert" | "delete";
export interface OutboxEntry {
  entity: Entity;
  id: string;
  op: Op;
  v: number;
}
export type Outbox = Record<string, OutboxEntry>;

export interface LocalMeta {
  /** Supabase-gebruiker waarvan deze lokale data een kopie is. */
  ownerId?: string;
  lastSyncedAt?: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Vult ontbrekende velden aan (voor oudere of handmatig bewerkte data). */
export function normalizeUserData(d: Partial<UserData> | null | undefined): UserData {
  const base = emptyUserData();
  if (!d) return base;
  return {
    version: 1,
    exercises: d.exercises ?? {},
    formats: d.formats ?? {},
    blocks: d.blocks ?? {},
    templates: d.templates ?? {},
    lessons: d.lessons ?? {},
    hidden: Array.isArray(d.hidden) ? d.hidden : [],
    favorites: Array.isArray(d.favorites) ? d.favorites : [],
    recent: Array.isArray(d.recent) ? d.recent : [],
    prefs: withPrefDefaults(d.prefs),
  };
}

/** Eerste start: lege data met de vier voorbeeldlessen als bewerkbare lessen. */
export function firstRunData(): UserData {
  const d = emptyUserData();
  for (const l of SEED_LESSONS) d.lessons[l.id] = structuredClone(l);
  return d;
}

export function loadLocal(): { data: UserData; fresh: boolean } {
  const stored = read<UserData>(DATA_KEY);
  if (!stored) return { data: firstRunData(), fresh: true };
  return { data: normalizeUserData(stored), fresh: false };
}

export function saveLocal(data: UserData): boolean {
  return write(DATA_KEY, data);
}

export function loadOutbox(): Outbox {
  return read<Outbox>(OUTBOX_KEY) ?? {};
}

export function saveOutbox(o: Outbox) {
  write(OUTBOX_KEY, o);
}

export function loadMeta(): LocalMeta {
  return read<LocalMeta>(META_KEY) ?? {};
}

export function saveMeta(m: LocalMeta) {
  write(META_KEY, m);
}

export function clearLocal() {
  try {
    globalThis.localStorage?.removeItem(DATA_KEY);
    globalThis.localStorage?.removeItem(OUTBOX_KEY);
    globalThis.localStorage?.removeItem(META_KEY);
  } catch {
    /* noop */
  }
}

export function storageAvailable(): boolean {
  try {
    const k = "fightlab:probe";
    globalThis.localStorage.setItem(k, "1");
    globalThis.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
