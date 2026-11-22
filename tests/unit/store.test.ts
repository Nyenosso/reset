import { beforeEach, describe, expect, it } from "vitest";
import { getOutbox, resetOutbox, selectLibrary, useStore } from "@/lib/store";
import { firstRunData } from "@/lib/store/persistence";
import { SEED_EXERCISES } from "@/data/seed";
import { blockFromExercise } from "@/lib/data/lesson-ops";
import { mergeLibrary } from "@/lib/data/library";

const st = () => useStore.getState();

beforeEach(() => {
  resetOutbox();
  useStore.setState({ ready: true, data: firstRunData() });
});

describe("store", () => {
  it("aanpassing van een ingebouwde oefening is een override die seed-updates overleeft", () => {
    const jab = SEED_EXERCISES.find((e) => e.name === "Single Jab")!;
    st().saveItem({ ...jab, description: "Mijn eigen omschrijving" });
    expect(getOutbox()["exercise:ex-single-jab"].op).toBe("upsert");
    const lib = selectLibrary(st().data);
    expect(lib.exercise.get(jab.id)!.description).toBe("Mijn eigen omschrijving");
    expect(lib.modified.has("exercise:ex-single-jab")).toBe(true);
    // Simuleer een nieuwe seedversie: het opgeslagen override wint nog steeds.
    const merged = mergeLibrary({ ...st().data });
    expect(merged.exercise.get(jab.id)!.description).toBe("Mijn eigen omschrijving");
    st().resetItem("exercise", jab.id);
    expect(selectLibrary(st().data).exercise.get(jab.id)!.description).toBe(jab.description);
  });

  it("ingebouwd item verbergen is herstelbaar; eigen item verwijderen ook", () => {
    const r = st().deleteItem("format", "fmt-emom")!;
    expect(selectLibrary(st().data).format.has("fmt-emom")).toBe(false);
    r.restore();
    expect(selectLibrary(st().data).format.has("fmt-emom")).toBe(true);
    const copy = st().duplicateItem("exercise", "ex-single-jab")!;
    expect(copy.builtin).toBe(false);
    expect(copy.basedOn).toBe("ex-single-jab");
    const r2 = st().deleteItem("exercise", copy.id)!;
    expect(st().data.exercises[copy.id]).toBeUndefined();
    r2.restore();
    expect(st().data.exercises[copy.id]).toBeDefined();
  });

  it("favorieten gaan via de outbox", () => {
    st().toggleFavorite("block", "blk-shared-mission");
    expect(st().data.favorites).toContain("block:blk-shared-mission");
    expect(getOutbox()["favorite:block:blk-shared-mission"].op).toBe("upsert");
    st().toggleFavorite("block", "blk-shared-mission");
    expect(getOutbox()["favorite:block:blk-shared-mission"].op).toBe("delete");
  });

  it("lesblokken toevoegen, verplaatsen, verwijderen en terugzetten", () => {
    const id = Object.keys(st().data.lessons)[0];
    const n = st().data.lessons[id].blocks.length;
    const b = blockFromExercise(SEED_EXERCISES[0]);
    st().addBlocks(id, [b], 1);
    expect(st().data.lessons[id].blocks[1].id).toBe(b.id);
    st().moveBlock(id, 1, n);
    expect(st().data.lessons[id].blocks[n].id).toBe(b.id);
    const r = st().removeBlock(id, b.id)!;
    expect(st().data.lessons[id].blocks).toHaveLength(n);
    r.restore();
    expect(st().data.lessons[id].blocks[n].id).toBe(b.id);
  });

  it("dupliceren behoudt het origineel; verwijderen is eerst zacht (prullenbak)", () => {
    const id = Object.keys(st().data.lessons)[0];
    const copyId = st().duplicateLessonById(id)!;
    expect(st().data.prefs.activeLessonId).toBe(copyId);
    st().updateLesson(copyId, (l) => ({ ...l, blocks: l.blocks.slice(1) }));
    expect(st().data.lessons[id].blocks.length).toBe(st().data.lessons[copyId].blocks.length + 1);
    st().deleteLesson(id);
    expect(st().data.lessons[id].deletedAt).toBeTruthy();
    st().restoreLesson(id);
    expect(st().data.lessons[id].deletedAt).toBeUndefined();
    st().purgeLesson(id);
    expect(st().data.lessons[id]).toBeUndefined();
    expect(getOutbox()[`lesson:${id}`].op).toBe("delete");
  });

  it("elke wijziging zet updatedAt", async () => {
    const id = Object.keys(st().data.lessons)[0];
    const before = st().data.lessons[id].updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    st().updateLesson(id, (l) => ({ ...l, title: "Nieuw" }));
    expect(st().data.lessons[id].updatedAt > before).toBe(true);
  });
});
