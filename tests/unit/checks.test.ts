import { describe, expect, it } from "vitest";
import { SEED_LESSONS } from "@/data/seed";
import { mergeLibrary } from "@/lib/data/library";
import { checkLesson } from "@/lib/data/checks";
import { emptyUserData } from "@/lib/data/defaults";
import { blockFromExercise, emptyBlock, newLesson } from "@/lib/data/lesson-ops";
import type { Lesson, LessonBlock } from "@/lib/domain/types";

const d = emptyUserData();
const lib = mergeLibrary(d);
const ex = (name: string) => lib.exercises.find((e) => e.name === name)!;
const lesson = (blocks: LessonBlock[], patch: Partial<Lesson> = {}) => newLesson(d.prefs, { blocks, ...patch });
const ids = (l: Lesson) => checkLesson(l, lib, d.prefs).map((c) => c.id.split("-lb-")[0].replace(/-\d+$/, ""));

describe("automatische lescontrole", () => {
  it("de voorbeeldlessen hebben geen waarschuwingen", () => {
    for (const l of SEED_LESSONS) expect(checkLesson(l, lib, d.prefs).filter((c) => c.level === "warning"), l.title).toEqual([]);
  });

  it("signaleert overschrijding en ongeplande tijd", () => {
    const over = lesson([{ ...emptyBlock("bag-basics", "Lang", 3900) }]);
    expect(checkLesson(over, lib, d.prefs).find((c) => c.id === "time-over")?.message).toContain("5:00 langer");
    const under = lesson([{ ...emptyBlock("bag-basics", "Kort", 600) }]);
    expect(checkLesson(under, lib, d.prefs).find((c) => c.id === "time-under")?.level).toBe("info");
  });

  it("vloeroefening met handschoenen aan is een waarschuwing", () => {
    const b = { ...blockFromExercise(ex("Push-up")), gloves: "aan" as const };
    const res = checkLesson(lesson([b]), lib, d.prefs);
    expect(res.find((c) => c.id.startsWith("gloves-floor"))?.message).toContain("Push-up");
  });

  it("te weinig zakken bij individueel werk", () => {
    const b = { ...blockFromExercise(ex("Continuous 1-2")), organization: "individueel" as const };
    const res = checkLesson(lesson([b], { participants: 24 }), lib, d.prefs);
    expect(res.find((c) => c.id.startsWith("bags"))?.message).toContain("24 zakken");
  });

  it("handschoenwissels en vloerovergang worden benoemd", () => {
    const punch = blockFromExercise(ex("Continuous 1-2"));
    const push = { ...blockFromExercise(ex("Push-up")), gloves: "uit" as const };
    const res = checkLesson(lesson([punch, push, { ...punch, id: "p2" }, { ...push, id: "q2" }, { ...punch, id: "p3" }]), lib, d.prefs);
    expect(res.some((c) => c.id.startsWith("glove-off") && c.message.includes("handschoenen uit"))).toBe(true);
    expect(res.some((c) => c.id === "glove-changes")).toBe(true);
  });

  it("maximale power na zware conditionele vermoeidheid", () => {
    const cardio = { ...emptyBlock("cardio", "Zwaar", 480), rpe: [8, 9] as [number, number], structure: null };
    const power = { ...blockFromExercise(ex("Single Power Cross")), phase: "speed-power" as const };
    expect(ids(lesson([cardio, power]))).toContain("power-after-fatigue");
  });

  it("weinig herstel bij explosief werk", () => {
    const b = { ...blockFromExercise(ex("Jump Squat")), phase: "speed-power" as const };
    b.structure = { explainSec: 0, setupSec: 0, rounds: 4, intervals: [{ id: "a", label: "Werk", kind: "work", seconds: 40 }, { id: "b", label: "Rust", kind: "rest", seconds: 10 }], restBetweenRoundsSec: 0, transitionSec: 0 };
    expect(ids(lesson([b]))).toContain("recovery");
  });

  it("geen partnerinteractie en geen gezamenlijke opdracht", () => {
    const a = { ...blockFromExercise(ex("Air Squat")), organization: "individueel" as const, partnerRoles: "" };
    const b = { ...a, id: "b2" };
    const res = ids(lesson([a, b]));
    expect(res).toContain("no-partner");
    expect(res).toContain("no-group");
  });

  it("de rol van de houder ontbreekt", () => {
    const b = { ...blockFromExercise(ex("Continuous 1-2")), partnerRoles: "" };
    expect(ids(lesson([b]))).toContain("holder");
  });
});
