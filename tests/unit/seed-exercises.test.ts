import { describe, expect, it } from "vitest";
import { SEED_EXERCISES, exerciseSeedIssues } from "@/data/seed/exercises";

describe("seed: oefeningen", () => {
  it("bouwt zonder problemen", () => {
    expect(exerciseSeedIssues).toEqual([]);
  });
  it("bevat minimaal 200 unieke oefeningen", () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(200);
    expect(new Set(SEED_EXERCISES.map((e) => e.id)).size).toBe(SEED_EXERCISES.length);
  });
  it("heeft geen dubbele omschrijvingen of uitvoeringen", () => {
    const d = SEED_EXERCISES.map((e) => e.description);
    expect(new Set(d).size).toBe(d.length);
    const i = SEED_EXERCISES.map((e) => e.instructions);
    expect(new Set(i).size).toBe(i.length);
  });
});
