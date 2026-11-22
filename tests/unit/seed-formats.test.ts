import { describe, expect, it } from "vitest";
import { SEED_FORMATS, formatSeedIssues } from "@/data/seed/formats";
import { structureSeconds } from "@/lib/time/structure";

describe("seed: formats", () => {
  it("bouwt zonder problemen", () => {
    expect(formatSeedIssues).toEqual([]);
  });
  it("bevat minimaal 100 inhoudelijk verschillende formats", () => {
    expect(SEED_FORMATS.length).toBeGreaterThanOrEqual(100);
    const rules = SEED_FORMATS.map((f) => f.rule);
    expect(new Set(rules).size).toBe(rules.length);
    const descriptions = SEED_FORMATS.map((f) => f.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
  it("heeft per format een spelregel, voorbeeld, doel, fasen, organisatie en structuur", () => {
    for (const f of SEED_FORMATS) {
      expect(f.rule.length, f.name).toBeGreaterThan(20);
      expect(f.example.length, f.name).toBeGreaterThan(10);
      expect(f.phases.length, f.name).toBeGreaterThan(0);
      expect(f.organization.length, f.name).toBeGreaterThan(0);
      expect(f.equipment.length, f.name).toBeGreaterThan(0);
      expect(structureSeconds(f.structure), f.name).toBeGreaterThan(30);
      expect(f.cues.length, f.name).toBeGreaterThan(0);
    }
  });
  it("bewaart herkomst (gangbaar versus concept)", () => {
    expect(SEED_FORMATS.find((f) => f.name === "EMOM")?.origin).toBe("gangbaar");
    expect(SEED_FORMATS.find((f) => f.name === "Captain’s Call")?.origin).toBe("concept");
  });
});
