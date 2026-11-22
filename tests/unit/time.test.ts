import { describe, expect, it } from "vitest";
import { continuous, partnerAB, structure, workRest } from "@/lib/time/presets";
import { blockSeconds, blockTimeStatus, describeStructure, describeWorkRest, lessonTotals, roundSeconds, structureSeconds, workSeconds } from "@/lib/time/structure";
import { formatClock, formatDuration, formatRange, formatWhiteboard, parseDuration } from "@/lib/time/format";
import { fitStructureToDuration } from "@/lib/data/lesson-ops";

describe("tijdsberekening", () => {
  it("5 rondes van 25 A / 5 wissel / 25 B / 5 reset + 1 min uitleg = 6 minuten", () => {
    const s = partnerAB(25, 5, 5);
    expect(roundSeconds(s)).toBe(60);
    expect(workSeconds(s)).toBe(300);
    expect(structureSeconds(s)).toBe(360);
  });

  it("telt uitleg, opstellen, rust tussen rondes en overgang mee", () => {
    const s = structure(4, [["Werk", "work", 40], ["Rust", "rest", 20]], { explain: 45, setup: 30, restBetween: 15, transition: 60 });
    // 45 + 30 + 4×60 + 3×15 + 60
    expect(structureSeconds(s)).toBe(45 + 30 + 240 + 45 + 60);
  });

  it("vaste duur gaat voor bij manual; mismatch wordt gesignaleerd", () => {
    const s = workRest(30, 30, 6);
    const auto = { structure: s, durationMode: "auto" as const, durationSec: 0 };
    expect(blockSeconds(auto)).toBe(420);
    const manual = { structure: s, durationMode: "manual" as const, durationSec: 480 };
    expect(blockSeconds(manual)).toBe(480);
    const st = blockTimeStatus(manual);
    expect(st.mismatch).toBe(true);
    expect(st.diff).toBe(-60);
    expect(blockTimeStatus({ structure: null, durationMode: "manual", durationSec: 300 }).mismatch).toBe(false);
  });

  it("berekent gepland, resterend en overschrijding van een les", () => {
    const b = (sec: number) => ({ id: String(sec), structure: null, durationMode: "manual" as const, durationSec: sec });
    const under = lessonTotals({ targetSec: 3600, blocks: [b(1800), b(1470)] } as never);
    expect(under.planned).toBe(3270);
    expect(formatClock(under.planned)).toBe("54:30");
    expect(formatClock(under.remaining)).toBe("5:30");
    const over = lessonTotals({ targetSec: 3600, blocks: [b(3000), b(780)] } as never);
    expect(formatClock(over.planned)).toBe("63:00");
    expect(over.over).toBe(180);
    expect(over.blocks[1].start).toBe(3000);
  });

  it("geen afrondingsfouten: alles in hele seconden", () => {
    const s = structure(3, [["Werk", "work", 20.4 as number], ["Rust", "rest", 9.6 as number]], { explain: 0 });
    expect(Number.isInteger(structureSeconds(s))).toBe(true);
  });

  it("formatteert tijden", () => {
    expect(formatWhiteboard(480)).toBe("8’");
    expect(formatWhiteboard(390)).toBe("6’30”");
    expect(formatWhiteboard(45)).toBe("45”");
    expect(formatDuration(390)).toBe("6:30 min");
    expect(formatDuration(45)).toBe("45 sec");
    expect(formatRange([240, 480])).toBe("4–8 min");
    expect(formatRange([20, 40])).toBe("20–40 sec");
    expect(formatClock(-90)).toBe("-1:30");
  });

  it("parseert invoer van de gebruiker", () => {
    expect(parseDuration("6")).toBe(360);
    expect(parseDuration("6:30")).toBe(390);
    expect(parseDuration("90s")).toBe(90);
    expect(parseDuration("90 sec")).toBe(90);
    expect(parseDuration("1m30")).toBe(90);
    expect(parseDuration("2 min")).toBe(120);
    expect(parseDuration("1,5")).toBe(90);
    expect(parseDuration("abc")).toBeNull();
  });

  it("beschrijft structuur en werk/rust per deelnemer", () => {
    const s = partnerAB(20, 10, 6);
    expect(describeStructure(s)).toBe("6 × (20 A werkt · 10 Wissel · 20 B werkt · 10 Reset)");
    expect(describeWorkRest(s)).toContain("20 sec werk : 40 sec herstel");
  });

  it("past rondes aan op een doelduur", () => {
    const s = partnerAB(25, 5, 5);
    expect(structureSeconds(fitStructureToDuration(s, 480))).toBe(480);
    const c = continuous(300, "AMRAP");
    expect(structureSeconds(fitStructureToDuration(c, 600))).toBe(600);
  });
});
