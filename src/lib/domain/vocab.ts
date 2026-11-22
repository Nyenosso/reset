/**
 * Vaste vocabulaires van FightLab. Ids zijn stabiel (worden opgeslagen),
 * labels zijn Nederlandstalige weergavenamen en mogen worden aangepast.
 */

export const PHASES = [
  { id: "opening", label: "Sociale opening", short: "Opening" },
  { id: "raise", label: "Raise", short: "Raise" },
  { id: "activate", label: "Activate", short: "Activate" },
  { id: "mobilize", label: "Mobilize", short: "Mobilize" },
  { id: "potentiate", label: "Potentiate", short: "Potentiate" },
  { id: "bag-basics", label: "Bag Basics", short: "Bag Basics" },
  { id: "skills", label: "Skills & Reaction", short: "Skills" },
  { id: "speed-power", label: "Speed & Power", short: "Speed & Power" },
  { id: "sc", label: "Strength & Conditioning", short: "S&C" },
  { id: "cardio", label: "Cardio & Endurance", short: "Cardio" },
  { id: "team", label: "Team Challenge", short: "Team" },
  { id: "finisher", label: "Finisher", short: "Finisher" },
  { id: "core", label: "Abs & Core", short: "Core" },
  { id: "cooldown", label: "Cooling-down", short: "Cool-down" },
  { id: "recovery", label: "Actief herstel", short: "Herstel" },
] as const;
export type Phase = (typeof PHASES)[number]["id"];

export const GOALS = [
  { id: "techniek", label: "Techniek" },
  { id: "coordinatie", label: "Coördinatie" },
  { id: "reactie", label: "Reactievermogen" },
  { id: "snelheid", label: "Snelheid" },
  { id: "explosiviteit", label: "Explosiviteit" },
  { id: "kracht", label: "Kracht" },
  { id: "spieruithouding", label: "Spieruithoudingsvermogen" },
  { id: "conditie", label: "Conditie" },
  { id: "fullbody", label: "Full body" },
  { id: "groepsgevoel", label: "Groepsgevoel" },
  { id: "samenwerking", label: "Samenwerking" },
  { id: "plezier", label: "Plezier" },
  { id: "mobiliteit", label: "Mobiliteit" },
  { id: "herstel", label: "Herstel" },
] as const;
export type Goal = (typeof GOALS)[number]["id"];

export const EQUIPMENT = [
  { id: "bokszak", label: "Bokszak" },
  { id: "pads", label: "Pads" },
  { id: "trapkussen", label: "Trapkussen" },
  { id: "slamball", label: "Slam ball" },
  { id: "gewichtjes", label: "Gewichtjes" },
  { id: "flexibeam", label: "Flexibeam" },
  { id: "lichaamsgewicht", label: "Lichaamsgewicht" },
] as const;
export type Equipment = (typeof EQUIPMENT)[number]["id"];

export const ORGANIZATIONS = [
  { id: "individueel", label: "Individueel", size: 1 },
  { id: "tweetallen", label: "Tweetallen", size: 2 },
  { id: "drietallen", label: "Drietallen", size: 3 },
  { id: "viertallen", label: "Viertallen", size: 4 },
  { id: "klassikaal", label: "Klassikaal", size: 0 },
] as const;
export type Organization = (typeof ORGANIZATIONS)[number]["id"];

/** Geschiktheid met bokshandschoenen. */
export const GLOVE_FITS = [
  { id: "aan", label: "Handschoenen aan" },
  { id: "uit", label: "Handschoenen uit" },
  { id: "beide", label: "Met of zonder handschoenen" },
] as const;
export type GloveFit = (typeof GLOVE_FITS)[number]["id"];

export const BLOCK_GLOVES = [
  { id: "aan", label: "Aan" },
  { id: "uit", label: "Uit" },
  { id: "wisselend", label: "Wisselend" },
] as const;
export type BlockGloves = (typeof BLOCK_GLOVES)[number]["id"];

export const MUSCLES = [
  { id: "benen", label: "Benen" },
  { id: "bilspieren", label: "Bilspieren" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "kuiten", label: "Kuiten" },
  { id: "heupen", label: "Heupen" },
  { id: "core", label: "Core" },
  { id: "schuine-buik", label: "Schuine buikspieren" },
  { id: "onderrug", label: "Onderrug" },
  { id: "schouders", label: "Schouders" },
  { id: "borst", label: "Borst" },
  { id: "rug", label: "Rug" },
  { id: "armen", label: "Armen" },
] as const;
export type Muscle = (typeof MUSCLES)[number]["id"];

export const PATTERNS = [
  { id: "stoot", label: "Stoten" },
  { id: "trap", label: "Trappen" },
  { id: "knie", label: "Knieën" },
  { id: "combinatie", label: "Combinatie" },
  { id: "voetenwerk", label: "Voetenwerk" },
  { id: "verdediging", label: "Verdediging" },
  { id: "squat", label: "Squat" },
  { id: "lunge", label: "Lunge" },
  { id: "heupstrek", label: "Heupstrekking" },
  { id: "duwen", label: "Duwen" },
  { id: "trekken", label: "Trekken" },
  { id: "rotatie", label: "Rotatie" },
  { id: "sprong", label: "Springen" },
  { id: "locomotie", label: "Locomotie" },
  { id: "isometrisch", label: "Isometrisch" },
  { id: "kuit", label: "Kuit / enkel" },
  { id: "core", label: "Core" },
  { id: "werpen", label: "Werpen / slammen" },
  { id: "mobiliteit", label: "Mobiliteit" },
  { id: "stretch", label: "Stretch" },
  { id: "ademhaling", label: "Ademhaling" },
] as const;
export type Pattern = (typeof PATTERNS)[number]["id"];

export const EXERCISE_GROUPS = [
  { id: "warmup", label: "Warming-up" },
  { id: "techniek", label: "Bokstechniek" },
  { id: "speedpower", label: "Speed & Power" },
  { id: "sc", label: "Strength & Conditioning" },
  { id: "cardio", label: "Cardio" },
  { id: "core", label: "Abs & Core" },
  { id: "cooldown", label: "Cooling-down" },
] as const;
export type ExerciseGroup = (typeof EXERCISE_GROUPS)[number]["id"];

export const EXERCISE_CATEGORIES = [
  { id: "raise", label: "Raise", group: "warmup" },
  { id: "activate", label: "Activate", group: "warmup" },
  { id: "mobilize", label: "Mobilize", group: "warmup" },
  { id: "potentiate", label: "Potentiate", group: "warmup" },
  { id: "stoten", label: "Stoten", group: "techniek" },
  { id: "trappen", label: "Trappen", group: "techniek" },
  { id: "voetenwerk", label: "Voetenwerk & verdediging", group: "techniek" },
  { id: "combinaties", label: "Combinaties", group: "techniek" },
  { id: "speed", label: "Speed", group: "speedpower" },
  { id: "power", label: "Power", group: "speedpower" },
  { id: "explosief", label: "Explosieve fitness", group: "speedpower" },
  { id: "upper", label: "Upper body", group: "sc" },
  { id: "lower", label: "Lower body", group: "sc" },
  { id: "fullbody", label: "Full body", group: "sc" },
  { id: "isometrisch", label: "Isometrisch", group: "sc" },
  { id: "cardio", label: "Cardio", group: "cardio" },
  { id: "core", label: "Abs & Core", group: "core" },
  { id: "cooldown", label: "Cooling-down", group: "cooldown" },
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]["id"];

export const FORMAT_SECTIONS = [
  { id: "algemeen", label: "Algemene trainingsformats" },
  { id: "techniek", label: "Techniek" },
  { id: "reactie", label: "Reactie" },
  { id: "speedpower", label: "Speed & Power" },
  { id: "cardio", label: "Cardio" },
  { id: "partner", label: "Partnerformats" },
  { id: "team", label: "Teamchallenges" },
  { id: "groep", label: "Viertallen & groepsdynamiek" },
  { id: "finisher", label: "Finishers" },
  { id: "origineel", label: "Originele concepten" },
] as const;
export type FormatSection = (typeof FORMAT_SECTIONS)[number]["id"];

export const ORIGINS = [
  { id: "gangbaar", label: "Gangbaar trainingsprincipe" },
  { id: "concept", label: "FightLab-concept" },
  { id: "eigen", label: "Eigen item" },
] as const;
export type Origin = (typeof ORIGINS)[number]["id"];

export const INTENSITIES = [
  { id: "laag", label: "Laag", range: [1, 3] as [number, number] },
  { id: "matig", label: "Matig", range: [4, 6] as [number, number] },
  { id: "hoog", label: "Hoog", range: [7, 8] as [number, number] },
  { id: "zeerhoog", label: "Zeer hoog", range: [9, 10] as [number, number] },
] as const;
export type Intensity = (typeof INTENSITIES)[number]["id"];

export const DURATION_BUCKETS = [
  { id: "1-3", label: "1–3 min", range: [60, 180] as [number, number] },
  { id: "3-5", label: "3–5 min", range: [180, 300] as [number, number] },
  { id: "5-8", label: "5–8 min", range: [300, 480] as [number, number] },
  { id: "8-12", label: "8–12 min", range: [480, 720] as [number, number] },
  { id: "12-20", label: "12–20 min", range: [720, 1200] as [number, number] },
] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number]["id"];

export const DIFFICULTY_LABELS = { 1: "Basis", 2: "Gemiddeld", 3: "Gevorderd" } as const;
export const LOGISTICS_LABELS = { 1: "Eenvoudig", 2: "Gemiddeld", 3: "Complex" } as const;
export type Level = 1 | 2 | 3;

export const LESSON_STATUSES = [
  { id: "concept", label: "Concept" },
  { id: "gepland", label: "Gepland" },
  { id: "gegeven", label: "Gegeven" },
] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number]["id"];

export const INTERVAL_KINDS = [
  { id: "work", label: "Werk" },
  { id: "switch", label: "Wissel" },
  { id: "rest", label: "Rust" },
  { id: "reset", label: "Reset" },
] as const;
export type IntervalKind = (typeof INTERVAL_KINDS)[number]["id"];

/** Kickboks-nummering zoals gebruikt in FightLab (orthodoxe stand). */
export const STRIKE_NUMBERS: Record<string, string> = {
  "1": "jab",
  "2": "cross",
  "3": "linkerhoek",
  "4": "rechterhoek",
  "9": "linker lowkick",
  "10": "rechter lowkick",
  "11": "linker bodyshot",
  "12": "rechter bodyshot",
};

type Labeled = { readonly id: string; readonly label: string };
function makeLookup<T extends readonly Labeled[]>(list: T) {
  const map = new Map<string, string>(list.map((x) => [x.id, x.label]));
  return (id: string | undefined | null) => (id ? (map.get(id) ?? id) : "");
}

export const phaseLabel = makeLookup(PHASES);
export const goalLabel = makeLookup(GOALS);
export const equipmentLabel = makeLookup(EQUIPMENT);
export const organizationLabel = makeLookup(ORGANIZATIONS);
export const muscleLabel = makeLookup(MUSCLES);
export const patternLabel = makeLookup(PATTERNS);
export const categoryLabel = makeLookup(EXERCISE_CATEGORIES);
export const formatSectionLabel = makeLookup(FORMAT_SECTIONS);
export const originLabel = makeLookup(ORIGINS);
export const gloveFitLabel = makeLookup(GLOVE_FITS);
export const statusLabel = makeLookup(LESSON_STATUSES);

export function phaseShort(id: string | undefined) {
  return PHASES.find((p) => p.id === id)?.short ?? id ?? "";
}

export function organizationSize(org: Organization): number {
  return ORGANIZATIONS.find((o) => o.id === org)?.size ?? 2;
}

export const ALL_EQUIPMENT: Equipment[] = EQUIPMENT.map((e) => e.id);
