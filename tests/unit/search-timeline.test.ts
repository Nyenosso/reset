import { describe, expect, it } from "vitest";
import { SEED_EXERCISES, SEED_FORMATS, SEED_LESSONS } from "@/data/seed";
import { filterExercises, filterFormats, searchItems } from "@/lib/data/search";
import { buildTimeline, firstStepOfBlock, totalSeconds } from "@/lib/coach/timeline";
import { partnerAB } from "@/lib/time/presets";
import { emptyBlock } from "@/lib/data/lesson-ops";

describe("zoeken en filteren", () => {
  it("‘lowkick’ vindt lowkicks bovenaan", () => {
    const res = searchItems(SEED_EXERCISES, "lowkick").slice(0, 10).map((e) => e.name);
    expect(res.every((n) => /lowkick/i.test(n))).toBe(true);
    expect(res).toContain("Rear Lowkick");
    expect(res).toContain("Front Lowkick");
  });
  it("nummering en aliassen", () => {
    expect(searchItems(SEED_EXERCISES, "1-2-3")[0].name).toBe("1-2-3");
    expect(searchItems(SEED_EXERCISES, "Jab-Cross")[0].name).toBe("1-2");
    expect(searchItems(SEED_EXERCISES, "rechter lowkick")[0].name).toBe("Rear Lowkick");
    expect(searchItems(SEED_FORMATS, "captain")[0].name).toBe("Captain’s Call");
  });
  it("filters combineren (EN tussen groepen, OF binnen een groep)", () => {
    const kicks = filterExercises(SEED_EXERCISES, { categories: ["trappen"] });
    const hard = filterExercises(SEED_EXERCISES, { categories: ["trappen"], difficulty: [3] });
    expect(hard.length).toBeLessThan(kicks.length);
    expect(hard.every((e) => e.categories.includes("trappen") && e.difficulty === 3)).toBe(true);
    const noGloves = filterExercises(SEED_EXERCISES, { gloves: ["uit"] });
    expect(noGloves.every((e) => e.gloves !== "aan")).toBe(true);
    const f = filterFormats(SEED_FORMATS, { phases: ["finisher"], organization: ["klassikaal"] });
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.phases.includes("finisher") && x.organization.includes("klassikaal"))).toBe(true);
  });
});

describe("coachmodus-tijdlijn", () => {
  it("bouwt stappen per interval en ronde", () => {
    const b = { ...emptyBlock("skills", "Test", 0), id: "b1", structure: partnerAB(25, 5, 5), durationMode: "auto" as const };
    const steps = buildTimeline({ blocks: [b] });
    expect(steps).toHaveLength(1 + 5 * 4);
    expect(steps[1]).toMatchObject({ label: "A werkt", seconds: 25, round: 1, rounds: 5 });
    expect(totalSeconds(steps)).toBe(360);
  });
  it("een vaste duur langer dan de structuur krijgt een bufferstap", () => {
    const b = { ...emptyBlock("skills", "Test", 420), id: "b1", structure: partnerAB(25, 5, 5), durationMode: "manual" as const };
    const steps = buildTimeline({ blocks: [b] });
    expect(steps.at(-1)).toMatchObject({ kind: "buffer", seconds: 60 });
  });
  it("de voorbeeldlessen duren in de coachmodus precies 60 minuten", () => {
    for (const l of SEED_LESSONS) {
      const steps = buildTimeline(l);
      expect(totalSeconds(steps)).toBe(3600);
      expect(steps[firstStepOfBlock(steps, 3)].blockIndex).toBe(3);
    }
  });
});
