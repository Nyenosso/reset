import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserData } from "@/lib/domain/types";
import { emptyUserData } from "@/lib/data/defaults";
import type { OutboxEntry } from "@/lib/store/persistence";
import {
  exerciseFromRows, exerciseRows, favoriteRow, formatFromRow, formatRow, lessonFromRows, lessonRows,
  prefsFromRow, prefsRow, templateFromRow, templateRow, trainingBlockFromRows, trainingBlockRows,
} from "./mapper";

export interface Remote {
  pull(): Promise<{ data: UserData; empty: boolean }>;
  push(entries: OutboxEntry[], data: UserData): Promise<void>;
}

type Row = Record<string, unknown>;

async function all(client: SupabaseClient, table: string): Promise<Row[]> {
  const out: Row[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await client.from(table).select("*").range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

function check(res: { error: { message: string } | null }, what: string) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

const quoteList = (ids: string[]) => `(${ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",")})`;

export function createSupabaseRemote(client: SupabaseClient, userId: string): Remote {
  return {
    async pull() {
      const [ex, rel, fm, bl, bx, tp, ls, lb, fav, pref] = await Promise.all([
        all(client, "exercises"), all(client, "exercise_relations"), all(client, "formats"), all(client, "training_blocks"),
        all(client, "training_block_exercises"), all(client, "lesson_templates"), all(client, "lessons"), all(client, "lesson_blocks"),
        all(client, "favorites"), all(client, "user_preferences"),
      ]);
      const d = emptyUserData();
      for (const r of ex) { const e = exerciseFromRows(r, rel); d.exercises[e.id] = e; }
      for (const r of fm) { const f = formatFromRow(r); d.formats[f.id] = f; }
      for (const r of bl) { const b = trainingBlockFromRows(r, bx); d.blocks[b.id] = b; }
      for (const r of tp) { const t = templateFromRow(r); d.templates[t.id] = t; }
      for (const r of ls) { const l = lessonFromRows(r, lb); d.lessons[l.id] = l; }
      d.favorites = fav.map((f) => `${f.item_type}:${f.item_id}`);
      const p = prefsFromRow(pref[0]);
      if (p) { d.prefs = p.prefs; d.hidden = p.hidden; d.recent = p.recent; }
      const empty = !ex.length && !fm.length && !bl.length && !tp.length && !ls.length && !fav.length && !pref.length;
      return { data: d, empty };
    },

    async push(entries, data) {
      for (const e of entries) {
        switch (e.entity) {
          case "exercise": {
            if (e.op === "delete") { check(await client.from("exercises").delete().eq("id", e.id), "oefening verwijderen"); break; }
            const ex = data.exercises[e.id];
            if (!ex) break;
            const { row, relations } = exerciseRows(ex, userId);
            check(await client.from("exercises").upsert(row, { onConflict: "user_id,id" }), "oefening opslaan");
            check(await client.from("exercise_relations").delete().eq("exercise_id", e.id), "relaties");
            if (relations.length) check(await client.from("exercise_relations").insert(relations), "relaties");
            break;
          }
          case "format": {
            if (e.op === "delete") { check(await client.from("formats").delete().eq("id", e.id), "format verwijderen"); break; }
            const f = data.formats[e.id];
            if (f) check(await client.from("formats").upsert(formatRow(f, userId), { onConflict: "user_id,id" }), "format opslaan");
            break;
          }
          case "block": {
            if (e.op === "delete") { check(await client.from("training_blocks").delete().eq("id", e.id), "blok verwijderen"); break; }
            const b = data.blocks[e.id];
            if (!b) break;
            const { row, items } = trainingBlockRows(b, userId);
            check(await client.from("training_blocks").upsert(row, { onConflict: "user_id,id" }), "blok opslaan");
            check(await client.from("training_block_exercises").delete().eq("block_id", e.id), "blokoefeningen");
            if (items.length) check(await client.from("training_block_exercises").insert(items), "blokoefeningen");
            break;
          }
          case "template": {
            if (e.op === "delete") { check(await client.from("lesson_templates").delete().eq("id", e.id), "structuur verwijderen"); break; }
            const t = data.templates[e.id];
            if (t) check(await client.from("lesson_templates").upsert(templateRow(t, userId), { onConflict: "user_id,id" }), "structuur opslaan");
            break;
          }
          case "lesson": {
            if (e.op === "delete") { check(await client.from("lessons").delete().eq("id", e.id), "les verwijderen"); break; }
            const l = data.lessons[e.id];
            if (!l) break;
            const { row, blocks } = lessonRows(l, userId);
            check(await client.from("lessons").upsert(row, { onConflict: "user_id,id" }), "les opslaan");
            if (blocks.length) {
              check(await client.from("lesson_blocks").upsert(blocks, { onConflict: "user_id,id" }), "lesblokken opslaan");
              check(await client.from("lesson_blocks").delete().eq("lesson_id", l.id).not("id", "in", quoteList(blocks.map((b) => String(b.id)))), "oude lesblokken");
            } else {
              check(await client.from("lesson_blocks").delete().eq("lesson_id", l.id), "oude lesblokken");
            }
            break;
          }
          case "favorite": {
            const row = favoriteRow(e.id, userId);
            if (e.op === "delete") check(await client.from("favorites").delete().eq("item_type", row.item_type as string).eq("item_id", row.item_id as string), "favoriet");
            else check(await client.from("favorites").upsert(row, { onConflict: "user_id,item_type,item_id" }), "favoriet");
            break;
          }
          case "prefs": {
            check(await client.from("user_preferences").upsert(prefsRow(data, userId), { onConflict: "user_id" }), "voorkeuren");
            break;
          }
        }
      }
    },
  };
}
