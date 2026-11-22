import type { ExerciseCategory, GloveFit, Level, Pattern } from "@/lib/domain/vocab";

/**
 * Compacte notatie voor seed-oefeningen. Lijsten zijn komma-gescheiden ids
 * (bijv. m: "benen,core"). De builder valideert alles en vult defaults aan.
 *
 * n = naam · d = korte omschrijving · i = uitvoering · c = coaching cues
 * f = veelvoorkomende fouten · s = veiligheid · e = eenvoudiger · h = gevorderd
 * pr = progressie · m/m2 = primaire/secundaire spiergroepen · p = bewegingspatroon
 * eq = materiaal · gl = handschoenen · t = duur (sec) · r = RPE · lvl = moeilijkheid
 * g = doelen · ph = lesfasen · org = organisatie · aka = alternatieve namen
 */
export interface ExSeed {
  n: string;
  d: string;
  i: string;
  aka?: string[];
  c?: string[];
  f?: string[];
  s?: string;
  e?: string;
  h?: string;
  pr?: string;
  m?: string;
  m2?: string;
  p?: Pattern;
  eq?: string;
  gl?: GloveFit;
  t?: [number, number];
  r?: [number, number];
  lvl?: Level;
  g?: string;
  ph?: string;
  org?: string;
  reps?: string;
  tags?: string;
}

export interface ExSection {
  cat: ExerciseCategory;
  defaults: Partial<ExSeed>;
  items: ExSeed[];
}

export function section(cat: ExerciseCategory, defaults: Partial<ExSeed>, items: ExSeed[]): ExSection {
  return { cat, defaults, items };
}
