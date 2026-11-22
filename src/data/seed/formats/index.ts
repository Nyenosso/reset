import type { Format } from "@/lib/domain/types";
import { EQUIPMENT, GOALS, ORGANIZATIONS, PHASES, type Equipment, type Goal, type Organization, type Phase } from "@/lib/domain/vocab";
import { normalizeSearch, slugify } from "@/lib/utils/text";
import { describeStructure, describeWorkRest } from "@/lib/time/structure";
import { FORMAT_CATALOG } from "@/data/catalog/format-catalog";
import { SEED_DATE } from "../meta";
import { seedExerciseIdByName } from "../exercises";
import type { FmtSection, FmtSeed } from "./types";
import { algemeen } from "./general";
import { reactie, techniek } from "./skills";
import { cardio, speedpower } from "./conditioning";
import { partner, team } from "./social";
import { finisher, groep, origineel } from "./group";

const SECTIONS: FmtSection[] = [algemeen, techniek, reactie, speedpower, cardio, partner, team, groep, finisher, origineel];

export const formatSeedIssues: string[] = [];

const valid = {
  goal: new Set<string>(GOALS.map((x) => x.id)),
  equipment: new Set<string>(EQUIPMENT.map((x) => x.id)),
  org: new Set<string>(ORGANIZATIONS.map((x) => x.id)),
  phase: new Set<string>(PHASES.map((x) => x.id)),
};

function list<T extends string>(value: string | undefined, kind: keyof typeof valid, where: string): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((x) => x.trim())
    .filter((x) => {
      if (!x) return false;
      if (!valid[kind].has(x)) {
        formatSeedIssues.push(`${where}: onbekende ${kind} "${x}"`);
        return false;
      }
      return true;
    }) as T[];
}

export const formatId = (name: string) => `fmt-${slugify(name)}`;

function defaultSwitchRule(s: FmtSeed): string {
  const labels = s.st.intervals.map((i) => i.label);
  if (labels.some((l) => l.startsWith("A")) && labels.some((l) => l.startsWith("B"))) return "A en B wisselen na elk werkinterval.";
  if ((s.org ?? "").includes("tweetallen")) return "In tweetallen wisselen na elk interval of na de opdracht.";
  return "Geen partnerwissel: iedereen werkt tegelijk.";
}

function defaultRoles(orgs: Organization[]): string {
  if (orgs.includes("tweetallen")) return "A werkt; B houdt de zak vast, telt en moedigt aan. Daarna wisselen.";
  if (orgs.includes("viertallen")) return "Twee duo’s per team: wie niet werkt, houdt de zak, telt of coacht.";
  if (orgs.includes("drietallen")) return "Eén werkt, één houdt de zak, één telt of coacht; roteren.";
  return "Iedereen werkt zelfstandig; de trainer geeft de signalen.";
}

function gloveText(gl: string): string {
  if (gl === "aan") return "Handschoenen blijven het hele blok aan.";
  if (gl === "uit") return "Handschoenen uit vóór de start van het blok.";
  return "Met of zonder handschoenen, afhankelijk van de gekozen oefeningen.";
}

function build(): Format[] {
  const out: Format[] = [];
  const ids = new Set<string>();
  for (const sec of SECTIONS) {
    for (const raw of sec.items) {
      const s: FmtSeed = { ...sec.defaults, ...raw };
      const id = formatId(s.n);
      const where = `format "${s.n}"`;
      if (ids.has(id)) {
        formatSeedIssues.push(`${where}: dubbele id`);
        continue;
      }
      ids.add(id);
      for (const key of ["d", "r", "vb"] as const) if (!s[key]) formatSeedIssues.push(`${where}: veld ${key} ontbreekt`);
      if (!s.g) formatSeedIssues.push(`${where}: hoofddoel ontbreekt`);
      const organization = list<Organization>(s.org, "org", where);
      const exerciseIds = (s.ex ?? [])
        .map((n) => {
          const exId = seedExerciseIdByName(n);
          if (!exId) formatSeedIssues.push(`${where}: oefening "${n}" niet gevonden`);
          return exId;
        })
        .filter((x): x is string => Boolean(x));
      const t = s.t ?? [5, 8];
      const gl = s.gl ?? "aan";
      out.push({
        kind: "format",
        id,
        builtin: true,
        origin: s.o ?? "concept",
        sourceNote: s.o === "gangbaar" ? "Gangbaar trainingsprincipe, uitgewerkt voor bokszaktraining" : "FightLab-concept uit de basisbibliotheek",
        notes: s.note,
        name: s.n,
        aliases: s.aka?.length ? s.aka : undefined,
        section: sec.section,
        description: s.d,
        rule: s.r,
        mainGoal: s.g ?? "conditie",
        goals: list<Goal>(s.g2, "goal", where),
        phases: list<Phase>(s.ph, "phase", where),
        rpe: s.rpe ?? [5, 7],
        durationSec: [t[0] * 60, t[1] * 60],
        structure: s.st,
        intervalText: describeStructure(s.st),
        workRest: describeWorkRest(s.st),
        switchRule: s.sw ?? defaultSwitchRule(s),
        organization,
        partnerRoles: s.roles ?? defaultRoles(organization),
        equipment: list<Equipment>(s.eq, "equipment", where),
        gloves: gl,
        gloveLogistics: s.gll ?? gloveText(gl),
        exerciseIds,
        community: s.com ?? "",
        example: s.vb,
        pros: s.pro ?? [],
        cons: s.con ?? [],
        cues: s.c ?? [],
        beginner: s.beg ?? "",
        advanced: s.adv ?? "",
        logistics: s.log ?? 1,
        difficulty: s.lvl ?? 1,
        competitive: s.comp ?? false,
        partnerInteraction: s.pi ?? "midden",
        maxParticipants: s.max,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      });
    }
  }

  // Catalogusdekking: elke naam moet als format of alias bestaan.
  const index = new Map<string, Format>();
  for (const f of out) {
    for (const n of [f.name, ...(f.aliases ?? [])]) {
      const key = normalizeSearch(n);
      const prev = index.get(key);
      if (prev && prev.id !== f.id) formatSeedIssues.push(`naam/alias "${n}" botst tussen ${prev.id} en ${f.id}`);
      index.set(key, f);
    }
  }
  for (const [sec, names] of Object.entries(FORMAT_CATALOG)) {
    for (const name of names) {
      if (!index.get(normalizeSearch(name))) formatSeedIssues.push(`catalogus ${sec}: "${name}" niet gevonden`);
    }
  }
  return out;
}

export const SEED_FORMATS: Format[] = build();

const nameIndex = new Map<string, string>();
for (const f of SEED_FORMATS) for (const n of [f.name, ...(f.aliases ?? [])]) nameIndex.set(normalizeSearch(n), f.id);

export function seedFormatIdByName(name: string): string | undefined {
  return nameIndex.get(normalizeSearch(name));
}
