import { describe, expect, it } from "vitest";
import { backupToJson, parseImport } from "@/lib/data/validation";
import { firstRunData } from "@/lib/store/persistence";

describe("import en validatie", () => {
  it("een back-up is volledig terug te lezen", () => {
    const data = firstRunData();
    data.favorites.push("exercise:ex-single-jab");
    const res = parseImport(backupToJson(data));
    expect(res.ok).toBe(true);
    if (res.ok && res.kind === "backup") {
      expect(Object.keys(res.data.lessons)).toHaveLength(4);
      expect(res.data.favorites).toContain("exercise:ex-single-jab");
    }
  });

  it("weigert ongeldige bestanden met een begrijpelijke Nederlandse melding", () => {
    expect(parseImport("{nope")).toEqual({ ok: false, error: "Dit is geen geldig JSON-bestand." });
    expect(parseImport(JSON.stringify({ app: "Iets anders" }))).toMatchObject({ ok: false, error: "Dit bestand is niet door FightLab gemaakt." });
    const bad = parseImport(JSON.stringify({ app: "FightLab", type: "lesson", schemaVersion: 1, lesson: { id: "x", title: "" } }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/^Ongeldig bestand bij ‘/);
    expect(parseImport(JSON.stringify({ app: "FightLab", type: "backup", schemaVersion: 99 }))).toMatchObject({ ok: false });
  });
});
