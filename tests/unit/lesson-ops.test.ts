import { describe, expect, it } from "vitest";
import { SEED_BLOCKS, SEED_FORMATS, SEED_LESSONS, SEED_TEMPLATES, SEED_EXERCISES } from "@/data/seed";
import { DEFAULT_PREFS } from "@/lib/data/defaults";
import {
  adjustBlockDuration,
  applyFormatToBlock,
  blockFromExercise,
  blockFromFormat,
  blockFromTraining,
  duplicateLesson,
  fillWithTraining,
  lessonFromTemplate,
  moveItem,
  setAutoDuration,
  setRounds,
} from "@/lib/data/lesson-ops";
import { blockSeconds, blockTimeStatus, lessonTotals } from "@/lib/time/structure";

describe("lesoperaties", () => {
  it("lesstructuur → tijdsloten van samen 60 minuten", () => {
    const t = SEED_TEMPLATES.find((x) => x.name === "Squad Saturday")!;
    const l = lessonFromTemplate(t, DEFAULT_PREFS);
    expect(l.blocks).toHaveLength(8);
    expect(l.blocks.every((b) => b.placeholder)).toBe(true);
    expect(lessonTotals(l).planned).toBe(3600);
  });

  it("dupliceren maakt een diepe kopie; het origineel blijft ongewijzigd", () => {
    const orig = SEED_LESSONS[0];
    const copy = duplicateLesson(orig);
    expect(copy.id).not.toBe(orig.id);
    expect(copy.blocks.map((b) => b.id)).not.toEqual(orig.blocks.map((b) => b.id));
    copy.blocks[2].exercises.push({ id: "x", name: "Extra" });
    copy.blocks[2].structure!.rounds = 99;
    expect(orig.blocks[2].exercises.some((e) => e.name === "Extra")).toBe(false);
    expect(orig.blocks[2].structure!.rounds).not.toBe(99);
    expect(copy.status).toBe("concept");
  });

  it("een bibliotheekblok wordt als snapshot met verwijzing in de les gezet", () => {
    const src = SEED_BLOCKS[0];
    const snap = blockFromTraining(src);
    expect(snap.sourceBlockId).toBe(src.id);
    snap.exercises.pop();
    snap.title = "Gewijzigd";
    expect(src.exercises.length).toBe(3);
    expect(src.title).toBe("The Perfect Combination");
  });

  it("tijdslot vullen behoudt de positie (id) van het slot", () => {
    const l = lessonFromTemplate(SEED_TEMPLATES[0], DEFAULT_PREFS);
    const filled = fillWithTraining(l.blocks[3], SEED_BLOCKS[3]);
    expect(filled.id).toBe(l.blocks[3].id);
    expect(filled.placeholder).toBe(false);
    expect(filled.title).toBe(SEED_BLOCKS[3].title);
  });

  it("format op een blok: nieuwe structuur, oefeningen blijven", () => {
    const b = blockFromExercise(SEED_EXERCISES.find((e) => e.name === "1-2-3")!);
    const f = SEED_FORMATS.find((x) => x.name === "Tabata")!;
    const next = applyFormatToBlock(b, f);
    expect(next.formatName).toBe("Tabata");
    expect(next.exercises).toHaveLength(1);
    expect(blockSeconds(next)).toBe(240 + 45);
  });

  it("format als nieuw blok met gewenste duur", () => {
    const f = SEED_FORMATS.find((x) => x.name === "Captain’s Call")!;
    expect(blockSeconds(blockFromFormat(f, [], { durationSec: 480 }))).toBe(480);
  });

  it("+30 sec maakt de duur vast en signaleert het verschil met de structuur", () => {
    const b = blockFromTraining(SEED_BLOCKS[0]);
    const longer = adjustBlockDuration(b, 30);
    expect(blockSeconds(longer)).toBe(blockSeconds(b) + 30);
    expect(blockTimeStatus(longer).mismatch).toBe(true);
    expect(blockTimeStatus(setAutoDuration(longer)).mismatch).toBe(false);
    expect(blockSeconds(setAutoDuration(setRounds(b, 6)))).toBe(blockSeconds(b) + 60);
  });

  it("verplaatst items in een lijst", () => {
    expect(moveItem([1, 2, 3, 4, 5, 6, 7], 4, 6)).toEqual([1, 2, 3, 4, 6, 7, 5]);
    expect(moveItem([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });
});
