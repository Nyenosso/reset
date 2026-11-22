import { describe, expect, it } from "vitest";
import { SEED_EXERCISES, SEED_FORMATS } from "@/data/seed";
import { recommendFormats, scoreFormat, surprise, type PickerContext } from "@/lib/data/recommend";
import { ALL_EQUIPMENT } from "@/lib/domain/vocab";
import { DEFAULT_EQUIPMENT_COUNTS } from "@/lib/data/defaults";
import { structureSeconds } from "@/lib/time/structure";

const ctx = (p: Partial<PickerContext> = {}): PickerContext => ({ participants: 20, available: [...ALL_EQUIPMENT], counts: { ...DEFAULT_EQUIPMENT_COUNTS }, favorites: new Set(), ...p });

describe("formatkiezer", () => {
  it("scenario B: cardio, 6–8 min, tweetallen, RPE 7–9 geeft passende formats bovenaan", () => {
    const recs = recommendFormats(SEED_FORMATS, SEED_EXERCISES, { phase: "cardio", duration: [360, 480], organization: "tweetallen", rpe: [7, 9], goals: ["conditie"], equipment: [] }, ctx());
    const top = recs.slice(0, 5);
    expect(top).toHaveLength(5);
    for (const r of top) {
      expect(r.feasible).toBe(true);
      expect(r.format.phases).toContain("cardio");
      expect(r.format.organization).toContain("tweetallen");
      expect(r.reasons.length).toBeGreaterThan(2);
    }
    expect(top[0].score).toBeGreaterThanOrEqual(recs[10].score);
  });

  it("harde beperking: ontbrekend materiaal maakt een format onuitvoerbaar en zakt naar beneden", () => {
    const recs = recommendFormats(SEED_FORMATS, SEED_EXERCISES, { goals: ["conditie"], equipment: [] }, ctx({ available: ["lichaamsgewicht"] }));
    const firstInfeasible = recs.findIndex((r) => !r.feasible);
    const lastFeasible = recs.map((r) => r.feasible).lastIndexOf(true);
    expect(firstInfeasible).toBeGreaterThan(lastFeasible);
    const bag = recs.find((r) => r.format.name === "Captain’s Call")!;
    expect(bag.feasible).toBe(false);
    expect(bag.warnings.join(" ")).toContain("Bokszak");
  });

  it("past perfect bij het doel maar niet bij 32 deelnemers → niet bovenaan", () => {
    const base = SEED_FORMATS.find((f) => f.name === "Captain’s Call")!;
    const small = { ...base, id: "fmt-small", name: "Kleine groep", maxParticipants: 12 };
    const recs = recommendFormats([small, ...SEED_FORMATS], SEED_EXERCISES, { phase: "skills", goals: ["reactie"], equipment: [] }, ctx({ participants: 32 }));
    const idx = recs.findIndex((r) => r.format.id === "fmt-small");
    expect(recs[idx].feasible).toBe(false);
    expect(idx).toBeGreaterThan(recs.findIndex((r) => r.format.id === base.id));
  });

  it("handschoenenfilter is een harde beperking", () => {
    const f = SEED_FORMATS.find((x) => x.name === "You Go I Hold")!;
    const r = scoreFormat(f, { gloves: "aan", goals: [], equipment: [] }, ctx());
    expect(r.feasible).toBe(false);
  });

  it("te weinig zakken bij individueel werk geeft een waarschuwing", () => {
    const f = SEED_FORMATS.find((x) => x.name === "Burst & Recover")!;
    const r = scoreFormat(f, { organization: "individueel", goals: [], equipment: [] }, ctx({ participants: 24, counts: { ...DEFAULT_EQUIPMENT_COUNTS, bokszak: 12 } }));
    expect(r.warnings.join(" ")).toMatch(/zakken nodig/);
  });

  it("stelt oefeningen en een passende duur voor", () => {
    const recs = recommendFormats(SEED_FORMATS, SEED_EXERCISES, { phase: "skills", duration: [480, 720], goals: [], equipment: [] }, ctx());
    const cc = recs.find((r) => r.format.name === "Captain’s Call")!;
    expect(cc.suggestedExercises.length).toBeGreaterThan(0);
    expect(cc.suggestedSec).toBeGreaterThanOrEqual(480);
    expect(cc.suggestedSec).toBeLessThanOrEqual(720 + 60);
    expect(structureSeconds(cc.format.structure)).toBe(360);
  });

  it("‘Verras me’ kiest een uitvoerbare, goed passende suggestie", () => {
    const recs = recommendFormats(SEED_FORMATS, SEED_EXERCISES, { phase: "finisher", goals: ["plezier"], equipment: [] }, ctx());
    const pick = surprise(recs, () => 0.5)!;
    expect(pick.feasible).toBe(true);
    expect(pick.score).toBeGreaterThanOrEqual(recs[0].score - 15);
  });

  it("alleen favorieten", () => {
    const fav = new Set(["format:fmt-emom"]);
    const recs = recommendFormats(SEED_FORMATS, SEED_EXERCISES, { favoritesOnly: true, goals: [], equipment: [] }, ctx({ favorites: fav }));
    expect(recs.map((r) => r.format.name)).toEqual(["EMOM"]);
  });
});
