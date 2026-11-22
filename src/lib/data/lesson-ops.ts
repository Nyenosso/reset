import type {
  BlockContent,
  BlockExercise,
  BlockStructure,
  Evaluation,
  Exercise,
  Format,
  Lesson,
  LessonBlock,
  LessonTemplate,
  Preferences,
  TrainingBlock,
} from "@/lib/domain/types";
import { organizationSize, type Organization, type Phase } from "@/lib/domain/vocab";
import { newId, nowIso } from "@/lib/utils/id";
import { partnerAB, withFreshIds, workRest, continuous } from "@/lib/time/presets";
import { blockSeconds, roundSeconds, structureSeconds } from "@/lib/time/structure";

/** Pure functies voor het opbouwen en wijzigen van lessen. Muteren nooit de invoer. */

export function newLesson(prefs: Preferences, patch: Partial<Lesson> = {}): Lesson {
  const now = nowIso();
  return {
    id: newId("les"),
    title: "Nieuwe les",
    audience: prefs.defaultAudience,
    participants: prefs.defaultParticipants,
    targetSec: prefs.defaultTargetSec,
    organization: prefs.defaultOrganization,
    equipment: [...prefs.equipmentAvailable],
    goals: [],
    status: "concept",
    favorite: false,
    notes: "",
    blocks: [],
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}

export function emptyBlock(phase: Phase = "bag-basics", title = "Nieuw blok", durationSec = 300): LessonBlock {
  return {
    id: newId("lb"),
    title,
    phase,
    exercises: [],
    structure: null,
    durationMode: "manual",
    durationSec,
    organization: "tweetallen",
    equipment: ["bokszak"],
    gloves: "aan",
    rpe: [5, 7],
    goals: [],
    instructions: "",
    partnerRoles: "",
    cues: [],
    easier: "",
    harder: "",
    notes: "",
  };
}

export function lessonFromTemplate(t: LessonTemplate, prefs: Preferences): Lesson {
  return newLesson(prefs, {
    title: t.slots.length ? t.name : "Nieuwe les",
    templateId: t.id,
    templateName: t.name,
    goals: [...t.focus],
    blocks: t.slots.map((s) => ({ ...emptyBlock(s.phase, s.title, s.durationSec), placeholder: true, notes: s.hint ?? "" })),
  });
}

function freshExercises(list: BlockExercise[]): BlockExercise[] {
  return list.map((e) => ({ ...e, id: newId("bx") }));
}

function cloneContent(c: BlockContent): BlockContent {
  return {
    title: c.title,
    phase: c.phase,
    formatId: c.formatId,
    formatName: c.formatName,
    exercises: freshExercises(c.exercises),
    structure: c.structure ? withFreshIds(c.structure) : null,
    durationMode: c.durationMode,
    durationSec: c.durationSec,
    organization: c.organization,
    equipment: [...c.equipment],
    gloves: c.gloves,
    rpe: [c.rpe[0], c.rpe[1]],
    goals: [...c.goals],
    instructions: c.instructions,
    partnerRoles: c.partnerRoles,
    cues: [...c.cues],
    easier: c.easier,
    harder: c.harder,
    notes: c.notes,
  };
}

/** Snapshot van een bibliotheekblok voor gebruik in een les (origineel blijft ongewijzigd). */
export function blockFromTraining(b: TrainingBlock): LessonBlock {
  return { id: newId("lb"), sourceBlockId: b.id, ...cloneContent(b) };
}

export function duplicateBlock(b: LessonBlock): LessonBlock {
  return { ...b, ...cloneContent(b), id: newId("lb"), placeholder: false };
}

export function duplicateLesson(l: Lesson, title?: string): Lesson {
  const now = nowIso();
  return {
    ...l,
    id: newId("les"),
    title: title ?? `${l.title} (kopie)`,
    status: "concept",
    favorite: false,
    evaluation: undefined,
    deletedAt: undefined,
    exampleId: undefined,
    blocks: l.blocks.map(duplicateBlock),
    createdAt: now,
    updatedAt: now,
  };
}

function toBlockExercise(e: Exercise, amount?: string, tag?: string): BlockExercise {
  return { id: newId("bx"), exerciseId: e.id, name: e.name, ...(amount ? { amount } : {}), ...(tag ? { tag } : {}) };
}

/** Pas het aantal rondes aan zodat de structuur zo dicht mogelijk bij de doelduur komt. */
export function fitStructureToDuration(s: BlockStructure, targetSec: number): BlockStructure {
  const fixed = s.explainSec + s.setupSec + s.transitionSec;
  const avail = Math.max(30, targetSec - fixed);
  if (s.rounds <= 1 && s.intervals.length === 1) {
    return { ...s, rounds: 1, intervals: [{ ...s.intervals[0], seconds: Math.round(avail / 15) * 15 || 15 }] };
  }
  const per = roundSeconds(s) + s.restBetweenRoundsSec;
  if (per <= 0) return s;
  const rounds = Math.max(1, Math.round((avail + s.restBetweenRoundsSec) / per));
  return { ...s, rounds };
}

export function blockFromFormat(f: Format, exercises: Exercise[] = [], opts: { durationSec?: number; phase?: Phase } = {}): LessonBlock {
  let structure = withFreshIds(f.structure);
  if (opts.durationSec) structure = fitStructureToDuration(structure, opts.durationSec);
  return {
    ...emptyBlock(opts.phase ?? f.phases[0] ?? "bag-basics", f.name),
    formatId: f.id,
    formatName: f.name,
    exercises: exercises.map((e) => toBlockExercise(e)),
    structure,
    durationMode: "auto",
    durationSec: structureSeconds(structure),
    organization: f.organization.includes("tweetallen") ? "tweetallen" : f.organization[0] ?? "tweetallen",
    equipment: [...f.equipment],
    gloves: f.gloves === "beide" ? "aan" : f.gloves,
    rpe: [f.rpe[0], f.rpe[1]],
    goals: [f.mainGoal, ...f.goals.filter((g) => g !== f.mainGoal)].slice(0, 3),
    instructions: f.rule,
    partnerRoles: f.partnerRoles,
    cues: [...f.cues],
    easier: f.beginner,
    harder: f.advanced,
  };
}

/** Eenvoudig standaardblok rond één oefening. */
export function blockFromExercise(e: Exercise, phase?: Phase): LessonBlock {
  const pair = e.organization.includes("tweetallen") || e.equipment.includes("bokszak");
  const work = Math.min(45, Math.max(20, e.durationSec[1]));
  const structure = pair ? partnerAB(work >= 30 ? 30 : 25, 5, 4) : workRest(work, 15, 4);
  return {
    ...emptyBlock(phase ?? e.phases[0] ?? "bag-basics", e.name),
    exercises: [toBlockExercise(e)],
    structure,
    durationMode: "auto",
    durationSec: structureSeconds(structure),
    organization: pair ? "tweetallen" : "individueel",
    equipment: e.equipment.filter((q) => q !== "lichaamsgewicht").length ? [...e.equipment] : ["lichaamsgewicht"],
    gloves: e.gloves === "beide" ? "aan" : e.gloves,
    rpe: [e.rpe[0], e.rpe[1]],
    goals: e.goals.slice(0, 3),
    instructions: e.instructions,
    partnerRoles: pair ? "A werkt; B houdt de zak vast en telt. Wissel na elk interval." : "",
    cues: [...e.cues],
    easier: e.easier ?? "",
    harder: e.harder ?? "",
  };
}

export function addExerciseToBlock<T extends BlockContent & { placeholder?: boolean }>(b: T, e: Exercise): T {
  const placeholderTitle = b.placeholder && b.exercises.length === 0;
  return {
    ...b,
    placeholder: false,
    exercises: [...b.exercises, toBlockExercise(e)],
    equipment: Array.from(new Set([...b.equipment, ...e.equipment.filter((q) => q !== "lichaamsgewicht")])).filter(Boolean),
    cues: b.cues.length ? b.cues : [...e.cues],
    title: placeholderTitle ? b.title : b.title,
  };
}

/** Format op een bestaand blok toepassen: nieuwe werkstructuur, oefeningen blijven. */
export function applyFormatToBlock<T extends BlockContent & { placeholder?: boolean }>(b: T, f: Format): T {
  const keepManual = b.durationMode === "manual" && b.placeholder;
  const structure = keepManual ? fitStructureToDuration(withFreshIds(f.structure), b.durationSec) : withFreshIds(f.structure);
  return {
    ...b,
    placeholder: false,
    formatId: f.id,
    formatName: f.name,
    structure,
    durationMode: "auto",
    durationSec: structureSeconds(structure),
    instructions: b.instructions || f.rule,
    partnerRoles: b.partnerRoles || f.partnerRoles,
    cues: b.cues.length ? b.cues : [...f.cues],
    rpe: b.exercises.length ? b.rpe : [f.rpe[0], f.rpe[1]],
    easier: b.easier || f.beginner,
    harder: b.harder || f.advanced,
  };
}

/** Vul een tijdslot (placeholder) met een bibliotheekblok; titel en fase van het slot blijven. */
export function fillWithTraining(slot: LessonBlock, t: TrainingBlock): LessonBlock {
  const filled = blockFromTraining(t);
  return { ...filled, id: slot.id, placeholder: false };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(Math.max(0, Math.min(to, copy.length)), 0, item);
  return copy;
}

/** Duur aanpassen (+30 s, +1 min …): blok krijgt een vaste duur. */
export function adjustBlockDuration(b: LessonBlock, deltaSec: number): LessonBlock {
  const current = blockSeconds(b);
  return { ...b, durationMode: "manual", durationSec: Math.max(30, current + deltaSec) };
}

export function setBlockDuration(b: LessonBlock, sec: number): LessonBlock {
  return { ...b, durationMode: "manual", durationSec: Math.max(15, Math.round(sec)) };
}

export function setRounds(b: LessonBlock, rounds: number): LessonBlock {
  if (!b.structure) return b;
  return { ...b, structure: { ...b.structure, rounds: Math.max(1, Math.round(rounds)) } };
}

/** Terug naar automatische duur (berekend uit de structuur). */
export function setAutoDuration(b: LessonBlock): LessonBlock {
  if (!b.structure) return b;
  return { ...b, durationMode: "auto", durationSec: structureSeconds(b.structure) };
}

export function lessonBlockToTraining(b: LessonBlock, name?: string): TrainingBlock {
  const now = nowIso();
  return {
    kind: "block",
    id: newId("blk"),
    builtin: false,
    origin: "eigen",
    basedOn: b.sourceBlockId,
    description: b.instructions.split(/[.!?]/)[0]?.trim() || b.title,
    tags: [],
    ...cloneContent(b),
    title: name ?? b.title,
    createdAt: now,
    updatedAt: now,
  };
}

export function markGiven(l: Lesson, evaluation: Evaluation): Lesson {
  return { ...l, status: "gegeven", evaluation: { ...l.evaluation, ...evaluation } };
}

/** Aantal benodigde zakken (of ander materiaal) bij deze organisatievorm. */
export function stationsNeeded(participants: number, org: Organization): number {
  const size = organizationSize(org);
  if (size === 0) return participants;
  return Math.ceil(participants / size);
}

export function newSimpleStructure(seconds: number): BlockStructure {
  return continuous(seconds, "Werk", { explain: 0 });
}
