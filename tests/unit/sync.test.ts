import { describe, expect, it } from "vitest";
import { SEED_BLOCKS, SEED_EXERCISES, SEED_LESSONS, SEED_TEMPLATES } from "@/data/seed";
import { exerciseFromRows, exerciseRows, lessonFromRows, lessonRows, prefsFromRow, prefsRow, templateFromRow, templateRow, trainingBlockFromRows, trainingBlockRows } from "@/lib/sync/mapper";
import { applyOutbox, mergeFirstLogin } from "@/lib/sync/merge";
import { createSupabaseRemote } from "@/lib/sync/remote";
import { firstRunData } from "@/lib/store/persistence";
import { emptyUserData } from "@/lib/data/defaults";
import type { SupabaseClient } from "@supabase/supabase-js";

const UID = "00000000-0000-0000-0000-000000000001";
const json = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("databasemapping", () => {
  it("les met blokken: rijen en terug zonder verlies", () => {
    const l = SEED_LESSONS[2];
    const { row, blocks } = lessonRows(l, UID);
    expect(row.user_id).toBe(UID);
    expect(blocks.map((b) => b.position)).toEqual(l.blocks.map((_, i) => i));
    const back = lessonFromRows(json(row), json(blocks).reverse());
    expect(back).toEqual(json(l));
  });

  it("oefening met relaties, trainingsblok met oefeningen, lesstructuur", () => {
    const e = { ...SEED_EXERCISES[0], relations: [{ kind: "harder" as const, id: "ex-jab" }] };
    const er = exerciseRows(e, UID);
    expect(er.row.builtin_id).toBe(e.id);
    expect(exerciseFromRows(json(er.row), json(er.relations))).toEqual(json(e));
    const b = SEED_BLOCKS[3];
    const br = trainingBlockRows(b, UID);
    expect(br.items).toHaveLength(b.exercises.length);
    expect(trainingBlockFromRows(json(br.row), json(br.items))).toEqual(json(b));
    const t = SEED_TEMPLATES[0];
    expect(templateFromRow(json(templateRow(t, UID)))).toEqual(json(t));
  });

  it("voorkeuren, verborgen items en recent", () => {
    const d = firstRunData();
    d.hidden.push("format:fmt-emom");
    const back = prefsFromRow(json(prefsRow(d, UID)))!;
    expect(back.hidden).toEqual(["format:fmt-emom"]);
    expect(back.prefs.defaultParticipants).toBe(20);
  });
});

describe("samenvoegen", () => {
  it("server is bron van waarheid; openstaande lokale wijzigingen gaan voor", () => {
    const remote = firstRunData();
    const local = structuredClone(remote);
    const id = Object.keys(local.lessons)[0];
    const other = Object.keys(local.lessons)[1];
    local.lessons[id] = { ...local.lessons[id], title: "Lokaal gewijzigd" };
    delete local.lessons[other];
    remote.lessons[Object.keys(remote.lessons)[2]].title = "Op ander apparaat gewijzigd";
    const merged = applyOutbox(remote, local, {
      [`lesson:${id}`]: { entity: "lesson", id, op: "upsert", v: 1 },
      [`lesson:${other}`]: { entity: "lesson", id: other, op: "delete", v: 2 },
    });
    expect(merged.lessons[id].title).toBe("Lokaal gewijzigd");
    expect(merged.lessons[other]).toBeUndefined();
    expect(Object.values(merged.lessons).some((l) => l.title === "Op ander apparaat gewijzigd")).toBe(true);
  });

  it("eerste login: nieuwste versie wint, lokale demo-gegevens worden geüpload", () => {
    const remote = emptyUserData();
    const local = firstRunData();
    local.favorites = ["exercise:ex-single-jab"];
    const { data, upload } = mergeFirstLogin(local, remote);
    expect(Object.keys(data.lessons)).toHaveLength(4);
    expect(upload.filter(([e]) => e === "lesson")).toHaveLength(4);
    expect(data.favorites).toEqual(["exercise:ex-single-jab"]);
  });
});

/** Minimale nep-Supabase die alle aanroepen vastlegt. */
function fakeClient() {
  const calls: { table: string; op: string; payload?: unknown; filters: string[] }[] = [];
  const client = {
    from(table: string) {
      const rec = { table, op: "", payload: undefined as unknown, filters: [] as string[] };
      const q = {
        upsert(p: unknown) { rec.op = "upsert"; rec.payload = p; calls.push(rec); return q; },
        insert(p: unknown) { rec.op = "insert"; rec.payload = p; calls.push(rec); return q; },
        delete() { rec.op = "delete"; calls.push(rec); return q; },
        select() { rec.op = "select"; calls.push(rec); return q; },
        eq(c: string, v: string) { rec.filters.push(`${c}=${v}`); return q; },
        not(c: string, o: string, v: string) { rec.filters.push(`${c} not ${o} ${v}`); return q; },
        range() { return Promise.resolve({ data: [], error: null }); },
        then(res: (v: { error: null }) => void) { res({ error: null }); },
      };
      return q;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

describe("Supabase-push", () => {
  it("les: upsert les + blokken en verwijder oude blokken", async () => {
    const { client, calls } = fakeClient();
    const data = firstRunData();
    const id = Object.keys(data.lessons)[0];
    await createSupabaseRemote(client, UID).push([{ entity: "lesson", id, op: "upsert", v: 1 }], data);
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual(["lessons:upsert", "lesson_blocks:upsert", "lesson_blocks:delete"]);
    expect(calls[2].filters[0]).toBe(`lesson_id=${id}`);
    expect(calls[2].filters[1]).toMatch(/^id not in \("/);
    expect((calls[0].payload as { user_id: string }).user_id).toBe(UID);
  });

  it("favoriet verwijderen en voorkeuren opslaan", async () => {
    const { client, calls } = fakeClient();
    await createSupabaseRemote(client, UID).push([{ entity: "favorite", id: "format:fmt-emom", op: "delete", v: 1 }, { entity: "prefs", id: "me", op: "upsert", v: 2 }], firstRunData());
    expect(calls[0]).toMatchObject({ table: "favorites", op: "delete", filters: ["item_type=format", "item_id=fmt-emom"] });
    expect(calls[1]).toMatchObject({ table: "user_preferences", op: "upsert" });
  });

  it("lege pull geeft lege gebruikersdata", async () => {
    const { client } = fakeClient();
    const res = await createSupabaseRemote(client, UID).pull();
    expect(res.empty).toBe(true);
    expect(Object.keys(res.data.lessons)).toHaveLength(0);
  });
});
