import { z } from "zod";
import {
  BLOCK_GLOVES,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FORMAT_SECTIONS,
  GLOVE_FITS,
  GOALS,
  INTERVAL_KINDS,
  LESSON_STATUSES,
  MUSCLES,
  ORGANIZATIONS,
  ORIGINS,
  PATTERNS,
  PHASES,
} from "@/lib/domain/vocab";
import type { Lesson, UserData } from "@/lib/domain/types";
import { emptyUserData, withPrefDefaults } from "./defaults";

/** Versie van het export-/back-upformaat. */
export const SCHEMA_VERSION = 1;

const ids = <T extends readonly { id: string }[]>(list: T) => z.enum(list.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]]);

const phase = ids(PHASES);
const goal = ids(GOALS);
const equipment = ids(EQUIPMENT);
const organization = ids(ORGANIZATIONS);
const origin = ids(ORIGINS);
const level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const range = z.tuple([z.number().min(0), z.number().min(0)]);
const secs = z.number().int().min(0).max(24 * 3600);
const iso = z.string().min(1);

export const intervalSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(120),
  kind: ids(INTERVAL_KINDS),
  seconds: secs,
  text: z.string().max(500).optional(),
});

export const structureSchema = z.object({
  explainSec: secs,
  setupSec: secs,
  rounds: z.number().int().min(1).max(200),
  intervals: z.array(intervalSchema).max(100),
  restBetweenRoundsSec: secs,
  transitionSec: secs,
});

const blockExerciseSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().optional(),
  name: z.string().min(1).max(200),
  tag: z.string().max(40).optional(),
  amount: z.string().max(80).optional(),
  note: z.string().max(500).optional(),
});

const blockContent = {
  title: z.string().min(1).max(200),
  phase,
  formatId: z.string().optional(),
  formatName: z.string().optional(),
  exercises: z.array(blockExerciseSchema).max(60),
  structure: structureSchema.nullable(),
  durationMode: z.enum(["auto", "manual"]),
  durationSec: secs,
  organization,
  equipment: z.array(equipment),
  gloves: ids(BLOCK_GLOVES),
  rpe: range,
  goals: z.array(goal),
  instructions: z.string().max(5000),
  partnerRoles: z.string().max(2000),
  cues: z.array(z.string().max(300)).max(30),
  easier: z.string().max(1000),
  harder: z.string().max(1000),
  notes: z.string().max(5000),
};

export const lessonBlockSchema = z.object({
  id: z.string().min(1),
  sourceBlockId: z.string().optional(),
  placeholder: z.boolean().optional(),
  ...blockContent,
});

const meta = {
  id: z.string().min(1),
  builtin: z.boolean(),
  origin,
  sourceNote: z.string().optional(),
  notes: z.string().optional(),
  basedOn: z.string().optional(),
  createdAt: iso,
  updatedAt: iso,
};

export const trainingBlockSchema = z.object({ ...meta, ...blockContent, kind: z.literal("block"), description: z.string().max(2000), tags: z.array(z.string()) });

export const exerciseSchema = z.object({
  ...meta,
  kind: z.literal("exercise"),
  name: z.string().min(1).max(200),
  aliases: z.array(z.string()).optional(),
  description: z.string().max(2000),
  instructions: z.string().max(5000),
  category: ids(EXERCISE_CATEGORIES),
  categories: z.array(ids(EXERCISE_CATEGORIES)).min(1),
  tags: z.array(z.string()),
  goals: z.array(goal),
  musclesPrimary: z.array(ids(MUSCLES)),
  musclesSecondary: z.array(ids(MUSCLES)),
  pattern: ids(PATTERNS),
  equipment: z.array(equipment),
  gloves: ids(GLOVE_FITS),
  durationSec: range,
  reps: z.string().optional(),
  rpe: range,
  difficulty: level,
  phases: z.array(phase),
  organization: z.array(organization),
  cues: z.array(z.string()),
  mistakes: z.array(z.string()),
  safety: z.string().optional(),
  easier: z.string().optional(),
  harder: z.string().optional(),
  progression: z.string().optional(),
  relations: z.array(z.object({ kind: z.enum(["easier", "harder", "variation"]), id: z.string() })).optional(),
});

export const formatSchema = z.object({
  ...meta,
  kind: z.literal("format"),
  name: z.string().min(1).max(200),
  aliases: z.array(z.string()).optional(),
  section: ids(FORMAT_SECTIONS),
  description: z.string().max(2000),
  rule: z.string().max(5000),
  mainGoal: goal,
  goals: z.array(goal),
  phases: z.array(phase),
  rpe: range,
  durationSec: range,
  structure: structureSchema,
  intervalText: z.string(),
  workRest: z.string(),
  switchRule: z.string(),
  organization: z.array(organization),
  partnerRoles: z.string(),
  equipment: z.array(equipment),
  gloves: ids(GLOVE_FITS),
  gloveLogistics: z.string(),
  exerciseIds: z.array(z.string()),
  exerciseHint: z.string().optional(),
  community: z.string(),
  example: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  cues: z.array(z.string()),
  beginner: z.string(),
  advanced: z.string(),
  logistics: level,
  difficulty: level,
  competitive: z.boolean(),
  partnerInteraction: z.enum(["laag", "midden", "hoog"]),
  maxParticipants: z.number().int().positive().optional(),
});

export const templateSchema = z.object({
  ...meta,
  kind: z.literal("template"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  focus: z.array(goal),
  slots: z.array(z.object({ id: z.string(), title: z.string().min(1), phase, durationSec: secs, hint: z.string().optional() })),
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  date: z.string().optional(),
  audience: z.string().max(200),
  participants: z.number().int().min(1).max(200),
  targetSec: secs,
  organization,
  equipment: z.array(equipment),
  goals: z.array(goal),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
  status: ids(LESSON_STATUSES),
  favorite: z.boolean(),
  notes: z.string().max(5000),
  blocks: z.array(lessonBlockSchema).max(80),
  evaluation: z
    .object({
      date: z.string().optional(),
      participants: z.number().int().min(0).max(200).optional(),
      rating: z.number().min(0).max(5).optional(),
      summary: z.string().optional(),
      wentWell: z.string().optional(),
      improve: z.string().optional(),
      scores: z.string().optional(),
      reuse: z.boolean().optional(),
    })
    .optional(),
  deletedAt: z.string().optional(),
  exampleId: z.string().optional(),
  createdAt: iso,
  updatedAt: iso,
});

const prefsSchema = z
  .object({
    defaultParticipants: z.number().int().min(1).max(200),
    defaultTargetSec: secs,
    defaultOrganization: organization,
    defaultAudience: z.string(),
    equipmentAvailable: z.array(equipment),
    equipmentCounts: z.record(z.string(), z.number().int().min(0)),
    soundEnabled: z.boolean(),
    vibrationEnabled: z.boolean(),
    keepScreenOn: z.boolean(),
    activeLessonId: z.string().optional(),
  })
  .partial();

export const userDataSchema = z.object({
  version: z.literal(1),
  exercises: z.record(z.string(), exerciseSchema),
  formats: z.record(z.string(), formatSchema),
  blocks: z.record(z.string(), trainingBlockSchema),
  templates: z.record(z.string(), templateSchema),
  lessons: z.record(z.string(), lessonSchema),
  hidden: z.array(z.string()),
  favorites: z.array(z.string()),
  recent: z.array(z.object({ kind: z.enum(["exercise", "format", "block", "template"]), id: z.string(), at: z.string() })).max(100),
  prefs: prefsSchema,
});

export type ImportResult = { ok: true; kind: "backup"; data: UserData } | { ok: true; kind: "lesson"; lesson: Lesson } | { ok: false; error: string };

function describeIssue(e: z.ZodError): string {
  const first = e.issues[0];
  if (!first) return "Onbekende fout in het bestand.";
  return `Ongeldig bestand bij ‘${first.path.join(".") || "(root)"}’: ${first.message}`;
}

/** Leest een FightLab-back-up of een losse les (JSON) en valideert die volledig. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Dit is geen geldig JSON-bestand." };
  }
  if (!raw || typeof raw !== "object") return { ok: false, error: "Leeg of onbekend bestand." };
  const obj = raw as Record<string, unknown>;
  if (obj.app !== "FightLab") return { ok: false, error: "Dit bestand is niet door FightLab gemaakt." };
  if (typeof obj.schemaVersion === "number" && obj.schemaVersion > SCHEMA_VERSION) return { ok: false, error: "Dit bestand komt uit een nieuwere versie van FightLab." };
  if (obj.type === "lesson") {
    const r = lessonSchema.safeParse(obj.lesson);
    return r.success ? { ok: true, kind: "lesson", lesson: r.data as Lesson } : { ok: false, error: describeIssue(r.error) };
  }
  if (obj.type === "backup") {
    const r = userDataSchema.safeParse(obj.data);
    if (!r.success) return { ok: false, error: describeIssue(r.error) };
    const base = emptyUserData();
    return { ok: true, kind: "backup", data: { ...base, ...(r.data as unknown as UserData), prefs: withPrefDefaults(r.data.prefs as UserData["prefs"]) } };
  }
  return { ok: false, error: "Onbekend type FightLab-bestand." };
}

export function backupToJson(data: UserData): string {
  return JSON.stringify({ app: "FightLab", type: "backup", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}
