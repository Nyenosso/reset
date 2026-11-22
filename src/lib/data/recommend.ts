import type { Exercise, Format } from "@/lib/domain/types";
import {
  goalLabel,
  organizationLabel,
  organizationSize,
  phaseLabel,
  equipmentLabel,
  type Equipment,
  type Goal,
  type Level,
  type Organization,
  type Phase,
} from "@/lib/domain/vocab";
import { formatRange } from "@/lib/time/format";
import { structureSeconds } from "@/lib/time/structure";
import { fitStructureToDuration } from "./lesson-ops";
import { exerciseFitsEquipment } from "./search";

/**
 * Regelgebaseerde formatkiezer. Elke factor levert transparante punten op;
 * harde beperkingen (materiaal, handschoenen, groepsgrootte) wegen zwaar en
 * maken een suggestie ‘niet uitvoerbaar’.
 */
export interface PickerFilters {
  phase?: Phase;
  goals: Goal[];
  duration?: [number, number];
  rpe?: [number, number];
  organization?: Organization;
  equipment: Equipment[];
  gloves?: "aan" | "uit";
  difficulty?: Level;
  maxLogistics?: Level;
  competition?: "ja" | "nee";
  interaction?: "veel" | "weinig";
  favoritesOnly?: boolean;
  onlyAvailable?: boolean;
}

export interface PickerContext {
  participants: number;
  available: Equipment[];
  counts: Partial<Record<Equipment, number>>;
  favorites: Set<string>;
}

export interface Recommendation {
  format: Format;
  score: number;
  feasible: boolean;
  reasons: string[];
  warnings: string[];
  suggestedExercises: Exercise[];
  suggestedSec: number;
}

const PHASE_GROUPS: Phase[][] = [
  ["opening", "raise", "activate", "mobilize", "potentiate"],
  ["bag-basics", "skills"],
  ["speed-power", "potentiate"],
  ["sc", "cardio", "finisher"],
  ["team", "finisher", "opening"],
  ["core", "cooldown", "recovery"],
];

const sameGroup = (a: Phase, b: Phase) => PHASE_GROUPS.some((g) => g.includes(a) && g.includes(b));
const overlaps = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];

export function requiredEquipment(f: Format): Equipment[] {
  return f.equipment.filter((e) => e !== "lichaamsgewicht");
}

export function scoreFormat(f: Format, filters: PickerFilters, ctx: PickerContext): Omit<Recommendation, "suggestedExercises" | "suggestedSec"> {
  let score = 40;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let feasible = true;

  if (filters.phase) {
    if (f.phases.includes(filters.phase)) {
      score += 22;
      reasons.push(`Past bij ${phaseLabel(filters.phase)}`);
    } else if (f.phases.some((p) => sameGroup(p, filters.phase!))) {
      score += 8;
      reasons.push(`Verwant aan ${phaseLabel(filters.phase)}`);
    } else {
      score -= 18;
      warnings.push(`Bedoeld voor ${f.phases.map(phaseLabel).join(", ")}`);
    }
  }

  if (filters.goals.length) {
    const all = [f.mainGoal, ...f.goals];
    const hits = filters.goals.filter((g) => all.includes(g));
    const main = filters.goals.includes(f.mainGoal);
    score += Math.round((hits.length / filters.goals.length) * 22) + (main ? 6 : 0);
    if (hits.length) reasons.push(`Doel: ${hits.map(goalLabel).join(" + ")}`);
    else {
      score -= 10;
      warnings.push("Ander trainingsdoel");
    }
  }

  if (filters.duration) {
    if (overlaps(filters.duration, f.durationSec)) {
      score += 12;
      reasons.push(`${formatRange(f.durationSec)} past`);
    } else {
      score -= 6;
      warnings.push(`Normaal ${formatRange(f.durationSec)}; duur wordt aangepast`);
    }
  }

  if (filters.rpe) {
    if (overlaps(filters.rpe, f.rpe)) {
      score += 10;
      reasons.push(`Intensiteit RPE ${f.rpe[0]}–${f.rpe[1]}`);
    } else {
      score -= 12;
      warnings.push(`Intensiteit RPE ${f.rpe[0]}–${f.rpe[1]}`);
    }
  }

  if (filters.organization) {
    if (f.organization.includes(filters.organization)) {
      score += 10;
      reasons.push(organizationLabel(filters.organization));
    } else {
      score -= 14;
      warnings.push(`Organisatie: ${f.organization.map(organizationLabel).join(", ")}`);
    }
  }

  // Harde beperking: benodigd materiaal moet beschikbaar zijn.
  const req = requiredEquipment(f);
  const missing = req.filter((e) => !ctx.available.includes(e));
  if (missing.length && missing.length === req.length && req.length > 0) {
    feasible = false;
    score -= 60;
    warnings.push(`Vereist ${missing.map(equipmentLabel).join(", ")} (niet beschikbaar)`);
  } else if (missing.length) {
    score -= 10;
    warnings.push(`Deels materiaal niet beschikbaar: ${missing.map(equipmentLabel).join(", ")}`);
  }

  if (filters.equipment.length) {
    const hits = filters.equipment.filter((e) => f.equipment.includes(e));
    if (hits.length) {
      score += 8;
      reasons.push(`Met ${hits.map(equipmentLabel).join(", ").toLowerCase()}`);
    } else {
      score -= 18;
      warnings.push("Gebruikt ander materiaal");
    }
  }

  if (filters.gloves) {
    if (f.gloves !== "beide" && f.gloves !== filters.gloves) {
      score -= 35;
      feasible = false;
      warnings.push(filters.gloves === "aan" ? "Vraagt handschoenen uit" : "Vraagt handschoenen aan");
    } else reasons.push(filters.gloves === "aan" ? "Handschoenen kunnen aan blijven" : "Zonder handschoenen");
  }

  // Groepsgrootte en stations.
  if (f.maxParticipants && ctx.participants > f.maxParticipants) {
    feasible = false;
    score -= 50;
    warnings.push(`Werkt tot ${f.maxParticipants} deelnemers`);
  }
  const org = filters.organization && f.organization.includes(filters.organization) ? filters.organization : f.organization[0];
  if (org && f.equipment.includes("bokszak")) {
    const size = organizationSize(org) || 1;
    const bags = ctx.counts.bokszak ?? 99;
    const needed = Math.ceil(ctx.participants / size);
    if (needed > bags && !f.organization.some((o) => organizationSize(o) * bags >= ctx.participants)) {
      score -= 25;
      feasible = false;
      warnings.push(`${needed} zakken nodig, ${bags} beschikbaar`);
    } else if (needed > bags) {
      score -= 8;
      warnings.push(`${organizationLabel(org)}: ${needed} zakken nodig, ${bags} beschikbaar`);
    }
  }
  if (f.logistics === 3 && ctx.participants >= 24) {
    score -= 8;
    warnings.push("Logistiek complex bij een grote groep");
  }
  if (filters.maxLogistics && f.logistics > filters.maxLogistics) {
    score -= 15;
    warnings.push("Logistiek complexer dan gewenst");
  }
  if (filters.difficulty) {
    if (f.difficulty === filters.difficulty) score += 5;
    else if (f.difficulty > filters.difficulty) {
      score -= 8;
      warnings.push("Technisch moeilijker dan gekozen");
    }
  }
  if (filters.competition) {
    const want = filters.competition === "ja";
    if (f.competitive === want) {
      score += 5;
      if (want) reasons.push("Met competitie");
    } else score -= 10;
  }
  if (filters.interaction) {
    const high = f.partnerInteraction === "hoog";
    if ((filters.interaction === "veel") === high) {
      score += 6;
      if (high) reasons.push("Veel partnerinteractie");
    } else score -= 6;
  }
  if (ctx.favorites.has(`format:${f.id}`)) {
    score += 3;
    reasons.push("Favoriet");
  }
  return { format: f, score: Math.max(0, Math.min(100, score)), feasible, reasons, warnings };
}

export function suggestExercises(f: Format, exercises: Map<string, Exercise>, all: Exercise[], filters: PickerFilters, ctx: PickerContext, limit = 3): Exercise[] {
  const available = ctx.available;
  const okGloves = (e: Exercise) => !filters.gloves || e.gloves === "beide" || e.gloves === filters.gloves;
  const fromFormat = f.exerciseIds
    .map((id) => exercises.get(id))
    .filter((e): e is Exercise => Boolean(e) && exerciseFitsEquipment(e!, available) && okGloves(e!));
  if (fromFormat.length >= limit) return fromFormat.slice(0, limit);
  const phase = filters.phase ?? f.phases[0];
  const goals = filters.goals.length ? filters.goals : [f.mainGoal];
  const extra = all
    .filter((e) => !fromFormat.includes(e) && e.phases.includes(phase) && exerciseFitsEquipment(e, available) && okGloves(e))
    .map((e) => ({ e, s: e.goals.filter((g) => goals.includes(g)).length }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit - fromFormat.length)
    .map((x) => x.e);
  return [...fromFormat, ...extra];
}

export function recommendFormats(formats: Format[], exercises: Exercise[], filters: PickerFilters, ctx: PickerContext): Recommendation[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const list = filters.favoritesOnly ? formats.filter((f) => ctx.favorites.has(`format:${f.id}`)) : formats;
  const scored = list.map((f) => scoreFormat(f, filters, ctx));
  const visible = filters.onlyAvailable ? scored.filter((r) => r.feasible) : scored;
  return visible
    .sort((a, b) => Number(b.feasible) - Number(a.feasible) || b.score - a.score || a.format.name.localeCompare(b.format.name, "nl"))
    .map((r) => {
      const target = filters.duration ? Math.round((filters.duration[0] + filters.duration[1]) / 2) : undefined;
      const st = target && !(structureSeconds(r.format.structure) >= filters.duration![0] && structureSeconds(r.format.structure) <= filters.duration![1])
        ? fitStructureToDuration(r.format.structure, target)
        : r.format.structure;
      return { ...r, suggestedSec: structureSeconds(st), suggestedExercises: suggestExercises(r.format, byId, exercises, filters, ctx) };
    });
}

/** ‘Verras me’: willekeurige keuze uit de best passende, uitvoerbare suggesties. */
export function surprise(recs: Recommendation[], rand: () => number = Math.random): Recommendation | undefined {
  const feasible = recs.filter((r) => r.feasible);
  if (!feasible.length) return recs[0];
  const top = feasible[0].score;
  const pool = feasible.filter((r) => r.score >= top - 15).slice(0, 12);
  return pool[Math.floor(rand() * pool.length)];
}
