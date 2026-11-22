import { describe, expect, it } from "vitest";
import { SEED_LESSONS } from "@/data/seed";
import { lessonToJson, lessonToMarkdown, lessonToText } from "@/lib/data/export";
import { parseImport } from "@/lib/data/validation";

const squad = SEED_LESSONS.find((l) => l.title.startsWith("Squad Saturday"))!;

describe("export", () => {
  it("whiteboardtekst bevat inhoud en correcte tijden", () => {
    const t = lessonToText(squad);
    expect(t.split("\n")[0]).toBe("BOKSZAKTRAINING — SQUAD SATURDAY — POWER & TEAMWORK");
    expect(t).toContain("1. SOCIALE OPENING — 2’");
    expect(t).toContain("4. SKILLS & REACTION — THE THREE COMMANDS — 8’");
    expect(t).toContain("SNEL: Four Straight Burst");
    expect(t).toContain("6 × (25 A werkt · 5 Wissel · 25 B werkt · 5 Reset)");
    expect(t.trim().endsWith("TOTAAL: 60’")).toBe(true);
  });

  it("markdown heeft koppen per blok", () => {
    const md = lessonToMarkdown(squad);
    expect(md.startsWith("# Squad Saturday")).toBe(true);
    expect(md).toContain("## 7. Shared Mission — 12’");
    expect(md).toContain("**Totaal: 60’**");
  });

  it("JSON-export is opnieuw te importeren", () => {
    const res = parseImport(lessonToJson(squad));
    expect(res.ok && res.kind === "lesson" && res.lesson.blocks.length).toBe(8);
  });
});
