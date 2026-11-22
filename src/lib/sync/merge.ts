import type { UserData } from "@/lib/domain/types";
import type { Entity, Outbox } from "@/lib/store/persistence";

type MapKey = "exercises" | "formats" | "blocks" | "templates" | "lessons";
const MAPS: [MapKey, Entity][] = [["exercises", "exercise"], ["formats", "format"], ["blocks", "block"], ["templates", "template"], ["lessons", "lesson"]];

/**
 * Server is de bron van waarheid. Openstaande lokale wijzigingen (outbox)
 * worden bovenop de serverdata gelegd, zodat niets verloren gaat.
 */
export function applyOutbox(remote: UserData, local: UserData, outbox: Outbox): UserData {
  const out: UserData = structuredClone(remote);
  for (const e of Object.values(outbox)) {
    const pair = MAPS.find(([, ent]) => ent === e.entity);
    if (pair) {
      const [key] = pair;
      const map = out[key] as Record<string, unknown>;
      if (e.op === "delete") delete map[e.id];
      else if ((local[key] as Record<string, unknown>)[e.id]) map[e.id] = (local[key] as Record<string, unknown>)[e.id];
    } else if (e.entity === "favorite") {
      out.favorites = e.op === "delete" ? out.favorites.filter((f) => f !== e.id) : out.favorites.includes(e.id) ? out.favorites : [...out.favorites, e.id];
    } else if (e.entity === "prefs") {
      out.prefs = local.prefs;
      out.hidden = local.hidden;
      out.recent = local.recent;
    }
  }
  return out;
}

/**
 * Eerste keer inloggen op dit apparaat: lokale (demo)gegevens en accountgegevens samenvoegen.
 * Per item wint de nieuwste versie; lokale winnaars worden geüpload.
 */
export function mergeFirstLogin(local: UserData, remote: UserData): { data: UserData; upload: [Entity, string][] } {
  const data: UserData = structuredClone(remote);
  const upload: [Entity, string][] = [];
  for (const [key, entity] of MAPS) {
    const l = local[key] as Record<string, { updatedAt: string }>;
    const r = data[key] as Record<string, { updatedAt: string }>;
    for (const [id, item] of Object.entries(l)) {
      const other = r[id];
      if (!other || item.updatedAt > other.updatedAt) {
        r[id] = item;
        upload.push([entity, id]);
      }
    }
  }
  for (const f of local.favorites) if (!data.favorites.includes(f)) {
    data.favorites.push(f);
    upload.push(["favorite", f]);
  }
  const remoteHasPrefs = remote.prefs.activeLessonId !== undefined || remote.hidden.length > 0 || remote.recent.length > 0;
  if (!remoteHasPrefs) {
    data.prefs = local.prefs;
    data.hidden = local.hidden;
    data.recent = local.recent;
    upload.push(["prefs", "me"]);
  } else {
    data.hidden = Array.from(new Set([...remote.hidden, ...local.hidden]));
  }
  return { data, upload };
}
