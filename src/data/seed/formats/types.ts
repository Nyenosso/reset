import type { BlockStructure } from "@/lib/domain/types";
import type { FormatSection, GloveFit, Goal, Level, Origin } from "@/lib/domain/vocab";
export { partnerAB as AB, workRest as WR, emom as EM, continuous as CT, structure as ST, rotateABC as ABC, tabata } from "@/lib/time/presets";

/**
 * Compacte notatie voor seed-formats (lijsten zijn komma-gescheiden ids).
 * n naam · d omschrijving · r centrale spelregel · g hoofddoel · g2 secundaire doelen · ph lesfasen
 * rpe intensiteit · t duur in minuten [min,max] · st standaard werkstructuur · sw wisselregel
 * org organisatie · roles partnerrollen · eq materiaal · gl handschoenen · gll handschoenenlogistiek
 * ex passende oefeningen (namen) · com groepsdynamiek · vb voorbeeld · pro/con voor- en nadelen
 * c coaching cues · beg/adv beginners- en gevorderdenvariant · log logistieke complexiteit
 * lvl technische moeilijkheid · comp competitie · pi partnerinteractie · max max. deelnemers · o herkomst
 */
export interface FmtSeed {
  n: string;
  aka?: string[];
  d: string;
  r: string;
  g?: Goal;
  g2?: string;
  ph?: string;
  rpe?: [number, number];
  t?: [number, number];
  st: BlockStructure;
  sw?: string;
  org?: string;
  roles?: string;
  eq?: string;
  gl?: GloveFit;
  gll?: string;
  ex?: string[];
  com?: string;
  vb: string;
  pro?: string[];
  con?: string[];
  c?: string[];
  beg?: string;
  adv?: string;
  log?: Level;
  lvl?: Level;
  comp?: boolean;
  pi?: "laag" | "midden" | "hoog";
  max?: number;
  o?: Origin;
  note?: string;
}

export interface FmtSection {
  section: FormatSection;
  defaults: Partial<FmtSeed>;
  items: FmtSeed[];
}

export function fsection(section: FormatSection, defaults: Partial<FmtSeed>, items: FmtSeed[]): FmtSection {
  return { section, defaults, items };
}
