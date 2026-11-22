import { describe, expect, it } from "vitest";
import { SEED_BLOCKS, SEED_LESSONS, SEED_TEMPLATES, blockSeedIssues, SEED_FORMATS, SEED_EXERCISES } from "@/data/seed";
import { blockSeconds, blockTimeStatus, lessonTotals } from "@/lib/time/structure";

const exIds = new Set(SEED_EXERCISES.map((e) => e.id));
const fmtIds = new Set(SEED_FORMATS.map((f) => f.id));
const blkIds = new Set(SEED_BLOCKS.map((b) => b.id));

describe("seed: blokken, structuren en lessen", () => {
  it("bouwt zonder problemen", () => {
    expect(blockSeedIssues).toEqual([]);
  });
  it("bevat minimaal 20 trainingsblokken met geldige verwijzingen", () => {
    expect(SEED_BLOCKS.length).toBeGreaterThanOrEqual(20);
    for (const b of SEED_BLOCKS) {
      if (b.formatId) expect(fmtIds.has(b.formatId), b.title).toBe(true);
      for (const e of b.exercises) if (e.exerciseId) expect(exIds.has(e.exerciseId), `${b.title}/${e.name}`).toBe(true);
      expect(b.instructions.length, b.title).toBeGreaterThan(20);
      expect(blockTimeStatus(b).mismatch, b.title).toBe(false);
    }
  });
  it("heeft de verplichte bloktijden", () => {
    const minutes = (title: string) => blockSeconds(SEED_BLOCKS.find((b) => b.title === title)!) / 60;
    expect(minutes("The Perfect Combination")).toBe(6);
    expect(minutes("The Quality Ladder")).toBe(8);
    expect(minutes("Distance Detective")).toBe(5);
    expect(minutes("The Three Commands")).toBe(6);
    expect(minutes("Squad Rescue")).toBe(10);
    expect(minutes("The Rematch")).toBe(7);
    expect(minutes("The Final Bell")).toBe(4);
  });
  it("bevat minimaal 8 lesstructuren van 60 minuten plus lege template", () => {
    const full = SEED_TEMPLATES.filter((t) => t.slots.length > 0);
    expect(full.length).toBeGreaterThanOrEqual(8);
    for (const t of full) expect(t.slots.reduce((a, s) => a + s.durationSec, 0), t.name).toBe(3600);
    expect(SEED_TEMPLATES.some((t) => t.slots.length === 0)).toBe(true);
    expect(SEED_TEMPLATES.find((t) => t.name.startsWith("Next Round"))?.slots.length).toBe(10);
  });
  it("bevat vier voorbeeldlessen van exact 60 minuten", () => {
    expect(SEED_LESSONS.length).toBe(4);
    for (const l of SEED_LESSONS) {
      expect(lessonTotals(l).planned, l.title).toBe(3600);
      for (const b of l.blocks) {
        if (b.sourceBlockId) expect(blkIds.has(b.sourceBlockId), `${l.title}/${b.title}`).toBe(true);
        expect(blockTimeStatus(b).mismatch).toBe(false);
      }
    }
  });
});
