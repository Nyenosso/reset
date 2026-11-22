import type {
  BlockGloves,
  Equipment,
  ExerciseCategory,
  FormatSection,
  GloveFit,
  Goal,
  IntervalKind,
  LessonStatus,
  Level,
  Muscle,
  Organization,
  Origin,
  Pattern,
  Phase,
} from "./vocab";

/** Alle tijden worden intern als hele seconden opgeslagen. */
export type Seconds = number;
export type Range = [number, number];
export type ISODate = string;

/** Gemeenschappelijke metadata van ieder bibliotheekitem. */
export interface LibraryMeta {
  id: string;
  /** true = afkomstig uit de meegeleverde basisbibliotheek (seed). */
  builtin: boolean;
  /** Herkomst: gangbaar principe, FightLab-concept of eigen item. */
  origin: Origin;
  /** Vrije toelichting op de herkomst. */
  sourceNote?: string;
  /** Eigen notities van de trainer. */
  notes?: string;
  /** Wanneer dit item een kopie is van een ander item. */
  basedOn?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ExerciseRelation {
  kind: "easier" | "harder" | "variation";
  id: string;
}

export interface Exercise extends LibraryMeta {
  kind: "exercise";
  name: string;
  aliases?: string[];
  description: string;
  instructions: string;
  /** Primaire categorie. */
  category: ExerciseCategory;
  /** Alle categorieën (incl. primaire). */
  categories: ExerciseCategory[];
  tags: string[];
  goals: Goal[];
  musclesPrimary: Muscle[];
  musclesSecondary: Muscle[];
  pattern: Pattern;
  equipment: Equipment[];
  gloves: GloveFit;
  durationSec: Range;
  reps?: string;
  rpe: Range;
  difficulty: Level;
  phases: Phase[];
  organization: Organization[];
  cues: string[];
  mistakes: string[];
  safety?: string;
  easier?: string;
  harder?: string;
  progression?: string;
  relations?: ExerciseRelation[];
}

export interface Interval {
  id: string;
  label: string;
  kind: IntervalKind;
  seconds: Seconds;
  /** Concrete opdracht tijdens dit interval (bijv. "A: 1-2-1-2 snel"). */
  text?: string;
}

/** Werkstructuur van een blok. Alle tijden in seconden. */
export interface BlockStructure {
  /** Uitleg/demonstratie vooraf. */
  explainSec: Seconds;
  /** Opstellen, materiaal pakken, handschoenen aan/uit. */
  setupSec: Seconds;
  rounds: number;
  /** Intervallen binnen één ronde. */
  intervals: Interval[];
  /** Extra rust tussen rondes (niet na de laatste ronde). */
  restBetweenRoundsSec: Seconds;
  /** Overgang naar het volgende blok (drinken, wisselen). */
  transitionSec: Seconds;
}

export interface BlockExercise {
  id: string;
  /** Verwijzing naar bibliotheekoefening (optioneel: vrije tekst mag ook). */
  exerciseId?: string;
  /** Snapshot van de naam of vrije tekst. */
  name: string;
  /** Kort label vóór de oefening: "A", "B", "Min 1", "SNEL"… */
  tag?: string;
  /** Aantal/duur: "20×", "40 afwisselend", "30 sec". */
  amount?: string;
  note?: string;
}

export interface BlockContent {
  title: string;
  phase: Phase;
  formatId?: string;
  /** Snapshot van de formatnaam. */
  formatName?: string;
  exercises: BlockExercise[];
  /** null = alleen een tijdslot zonder uitgewerkte intervallen. */
  structure: BlockStructure | null;
  /** auto = duur volgt uit de structuur; manual = vaste duur. */
  durationMode: "auto" | "manual";
  /** Bij manual de geplande duur; bij auto een cache van de berekende duur. */
  durationSec: Seconds;
  organization: Organization;
  equipment: Equipment[];
  gloves: BlockGloves;
  rpe: Range;
  goals: Goal[];
  instructions: string;
  partnerRoles: string;
  cues: string[];
  easier: string;
  harder: string;
  notes: string;
}

export interface TrainingBlock extends Omit<LibraryMeta, "notes">, BlockContent {
  kind: "block";
  description: string;
  tags: string[];
}

export interface LessonBlock extends BlockContent {
  id: string;
  /** Bibliotheekblok waarvan dit een kopie (snapshot) is. */
  sourceBlockId?: string;
  /** Tijdslot uit een lesstructuur dat nog gevuld moet worden. */
  placeholder?: boolean;
}

export interface Format extends LibraryMeta {
  kind: "format";
  name: string;
  aliases?: string[];
  section: FormatSection;
  description: string;
  /** De centrale spelregel. */
  rule: string;
  mainGoal: Goal;
  goals: Goal[];
  phases: Phase[];
  rpe: Range;
  durationSec: Range;
  /** Standaard werkstructuur wanneer het format aan een les wordt toegevoegd. */
  structure: BlockStructure;
  intervalText: string;
  workRest: string;
  switchRule: string;
  organization: Organization[];
  partnerRoles: string;
  equipment: Equipment[];
  gloves: GloveFit;
  gloveLogistics: string;
  exerciseIds: string[];
  exerciseHint?: string;
  community: string;
  example: string;
  pros: string[];
  cons: string[];
  cues: string[];
  beginner: string;
  advanced: string;
  logistics: Level;
  difficulty: Level;
  competitive: boolean;
  partnerInteraction: "laag" | "midden" | "hoog";
  /** Maximaal werkbare groepsgrootte; ontbreekt = schaalt tot 32. */
  maxParticipants?: number;
}

export interface TemplateSlot {
  id: string;
  title: string;
  phase: Phase;
  durationSec: Seconds;
  hint?: string;
}

export interface LessonTemplate extends LibraryMeta {
  kind: "template";
  name: string;
  description: string;
  focus: Goal[];
  slots: TemplateSlot[];
}

export interface Evaluation {
  date?: ISODate;
  participants?: number;
  rating?: number;
  summary?: string;
  wentWell?: string;
  improve?: string;
  scores?: string;
  reuse?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  date?: ISODate;
  audience: string;
  participants: number;
  targetSec: Seconds;
  organization: Organization;
  equipment: Equipment[];
  goals: Goal[];
  templateId?: string;
  templateName?: string;
  status: LessonStatus;
  favorite: boolean;
  notes: string;
  blocks: LessonBlock[];
  evaluation?: Evaluation;
  /** Ingevuld = in de prullenbak (herstelbaar). */
  deletedAt?: ISODate;
  /** Id van het voorbeeld waarop deze les is gebaseerd. */
  exampleId?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type LibraryKind = "exercise" | "format" | "block" | "template";
export type LibraryItem = Exercise | Format | TrainingBlock | LessonTemplate;

export interface RecentItem {
  kind: LibraryKind;
  id: string;
  at: ISODate;
}

export interface Preferences {
  defaultParticipants: number;
  defaultTargetSec: Seconds;
  defaultOrganization: Organization;
  defaultAudience: string;
  equipmentAvailable: Equipment[];
  equipmentCounts: Record<Equipment, number>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenOn: boolean;
  activeLessonId?: string;
}

/** Alles wat de gebruiker zelf bezit en wat gesynchroniseerd wordt. */
export interface UserData {
  version: 1;
  /** Eigen oefeningen én aangepaste versies van ingebouwde oefeningen (zelfde id). */
  exercises: Record<string, Exercise>;
  formats: Record<string, Format>;
  blocks: Record<string, TrainingBlock>;
  templates: Record<string, LessonTemplate>;
  lessons: Record<string, Lesson>;
  /** Verborgen ingebouwde items: "exercise:id". */
  hidden: string[];
  /** Favorieten: "exercise:id", "format:id", "block:id", "template:id". */
  favorites: string[];
  recent: RecentItem[];
  prefs: Preferences;
}
