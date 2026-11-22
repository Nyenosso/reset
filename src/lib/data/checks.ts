import type { Exercise, Format, Lesson, LessonBlock, Preferences } from "@/lib/domain/types";
import { equipmentLabel, organizationLabel, organizationSize, type Equipment } from "@/lib/domain/vocab";
import { formatClock, formatDuration } from "@/lib/time/format";
import { blockSeconds, blockTimeStatus, lessonTotals, workRestPerParticipant } from "@/lib/time/structure";
import type { Library } from "./library";

/**
 * Regelgebaseerde lescontrole. Alle meldingen zijn adviserend, nooit blokkerend.
 */
export type CheckLevel = "info" | "warning";
export type CheckArea = "tijd" | "logistiek" | "belasting" | "samenwerking" | "veiligheid";

export interface CheckResult {
  id: string;
  level: CheckLevel;
  area: CheckArea;
  message: string;
  blockIds?: string[];
}

const nr = (i: number) => i + 1;
const range = (a: number, b: number) => (a === b ? `blok ${nr(a)}` : `blok ${nr(a)}–${nr(b)}`);

function exercisesOf(b: LessonBlock, lib: Library): Exercise[] {
  return b.exercises.map((e) => (e.exerciseId ? lib.exercise.get(e.exerciseId) : undefined)).filter((e): e is Exercise => Boolean(e));
}

function formatOf(b: LessonBlock, lib: Library): Format | undefined {
  return b.formatId ? lib.format.get(b.formatId) : undefined;
}

const isWork = (b: LessonBlock) => !["opening", "cooldown", "recovery"].includes(b.phase);
const heavyLegs = (b: LessonBlock, ex: Exercise[]) =>
  b.rpe[1] >= 7 && (b.phase === "sc" || b.phase === "cardio" || b.phase === "finisher") && ex.some((e) => e.musclesPrimary.includes("benen") && ["squat", "lunge", "sprong"].includes(e.pattern));
const shoulderLoad = (ex: Exercise[]) => ex.length > 0 && ex.filter((e) => e.musclesPrimary.includes("schouders")).length * 2 > ex.length;
const hasKicks = (ex: Exercise[]) => ex.some((e) => e.pattern === "trap" || e.categories.includes("trappen"));

export function checkLesson(lesson: Lesson, lib: Library, prefs: Preferences): CheckResult[] {
  const out: CheckResult[] = [];
  const blocks = lesson.blocks;
  const totals = lessonTotals(lesson);
  const exs = blocks.map((b) => exercisesOf(b, lib));

  // ——— Tijd ———
  if (blocks.length) {
    if (totals.over > 0) out.push({ id: "time-over", level: "warning", area: "tijd", message: `De les duurt ${formatClock(totals.over)} langer dan gepland (${formatClock(totals.planned)} van ${formatClock(totals.target)}).` });
    else if (totals.remaining >= 60) out.push({ id: "time-under", level: "info", area: "tijd", message: `Nog ${formatClock(totals.remaining)} niet ingepland.` });
  }
  blocks.forEach((b, i) => {
    const st = blockTimeStatus(b);
    if (st.mismatch && st.computed !== null) {
      out.push({
        id: `time-mismatch-${b.id}`,
        level: st.diff > 0 ? "warning" : "info",
        area: "tijd",
        message: st.diff > 0
          ? `Blok ${nr(i)}: de werkstructuur duurt ${formatDuration(st.computed)}, gepland is ${formatDuration(st.planned)}.`
          : `Blok ${nr(i)}: ${formatDuration(-st.diff)} van de geplande tijd is niet ingevuld in de structuur.`,
        blockIds: [b.id],
      });
    }
    const f = formatOf(b, lib);
    if (b.structure && b.structure.explainSec === 0 && f && f.logistics >= 2 && !b.placeholder && !["opening", "cooldown", "recovery"].includes(b.phase)) {
      out.push({ id: `explain-${b.id}`, level: "info", area: "tijd", message: `Blok ${nr(i)} (${f.name}) heeft geen uitlegtijd ingepland.`, blockIds: [b.id] });
    }
    const roles = new Set((b.structure?.intervals ?? []).filter((iv) => iv.kind === "work").map((iv) => iv.label.trim().charAt(0)));
    if (b.structure && roles.has("A") && roles.has("B") && !b.structure.intervals.some((iv) => iv.kind === "switch" || iv.kind === "reset" || iv.kind === "rest")) {
      out.push({ id: `switch-${b.id}`, level: "info", area: "tijd", message: `Blok ${nr(i)}: geen wisseltijd tussen partners ingepland.`, blockIds: [b.id] });
    }
  });
  const placeholders = blocks.filter((b) => b.placeholder);
  if (placeholders.length) out.push({ id: "placeholders", level: "info", area: "tijd", message: `${placeholders.length} ${placeholders.length === 1 ? "tijdslot is" : "tijdsloten zijn"} nog niet ingevuld.`, blockIds: placeholders.map((b) => b.id) });

  // ——— Logistiek ———
  const counts = prefs.equipmentCounts;
  blocks.forEach((b, i) => {
    if (b.placeholder) return;
    const size = organizationSize(b.organization);
    if (b.equipment.includes("bokszak") && size > 0) {
      const need = Math.ceil(lesson.participants / size);
      if (need > counts.bokszak) out.push({ id: `bags-${b.id}`, level: "warning", area: "logistiek", message: `Blok ${nr(i)}: ${organizationLabel(b.organization).toLowerCase()} met ${lesson.participants} deelnemers vraagt ${need} zakken; er zijn er ${counts.bokszak}.`, blockIds: [b.id] });
    }
    for (const eq of ["pads", "trapkussen", "slamball", "gewichtjes", "flexibeam"] as Equipment[]) {
      if (!b.equipment.includes(eq)) continue;
      if (!lesson.equipment.includes(eq) || !prefs.equipmentAvailable.includes(eq)) {
        out.push({ id: `eq-missing-${b.id}-${eq}`, level: "warning", area: "logistiek", message: `Blok ${nr(i)} gebruikt ${equipmentLabel(eq).toLowerCase()}, maar dat staat niet bij het beschikbare materiaal.`, blockIds: [b.id] });
        continue;
      }
      const perGroup = eq === "pads" || eq === "trapkussen" ? Math.max(1, size === 0 ? 1 : size) : 1;
      const need = Math.ceil(lesson.participants / perGroup);
      if (need > counts[eq] && eq !== "pads" && eq !== "trapkussen") {
        out.push({ id: `eq-count-${b.id}-${eq}`, level: "info", area: "logistiek", message: `Blok ${nr(i)}: ${need}× ${equipmentLabel(eq).toLowerCase()} nodig bij individueel werk, ${counts[eq]} beschikbaar. Werk in groepjes of rouleer.`, blockIds: [b.id] });
      } else if ((eq === "pads" || eq === "trapkussen") && Math.ceil(lesson.participants / Math.max(2, size || 2)) > counts[eq]) {
        out.push({ id: `eq-count-${b.id}-${eq}`, level: "info", area: "logistiek", message: `Blok ${nr(i)}: te weinig ${equipmentLabel(eq).toLowerCase()} voor alle tweetallen (${counts[eq]} beschikbaar).`, blockIds: [b.id] });
      }
    }
  });
  const real = blocks.filter((b) => !b.placeholder);
  let equipmentChanges = 0;
  let gloveChanges = 0;
  const gloveTransitions: number[] = [];
  for (let i = 1; i < real.length; i++) {
    const a = new Set(real[i - 1].equipment.filter((e) => e !== "lichaamsgewicht"));
    const bq = new Set(real[i].equipment.filter((e) => e !== "lichaamsgewicht"));
    if ([...bq].some((e) => !a.has(e))) equipmentChanges++;
    const ga = real[i - 1].gloves === "wisselend" ? "aan" : real[i - 1].gloves;
    const gb = real[i].gloves === "wisselend" ? "uit" : real[i].gloves;
    if (ga !== gb) {
      gloveChanges++;
      if (gb === "uit") gloveTransitions.push(blocks.indexOf(real[i]));
    }
  }
  if (equipmentChanges >= 4) out.push({ id: "eq-changes", level: "info", area: "logistiek", message: `Veel materiaalwissels (${equipmentChanges}). Overweeg blokken met hetzelfde materiaal te groeperen.` });
  if (gloveChanges > 3) out.push({ id: "glove-changes", level: "warning", area: "logistiek", message: `Handschoenen moeten ${gloveChanges} keer aan of uit. Groepeer blokken met en zonder handschoenen.` });
  for (const idx of gloveTransitions) {
    const b = blocks[idx];
    const first = exs[idx][0];
    out.push({ id: `glove-off-${b.id}`, level: "info", area: "logistiek", message: `Bij de overgang naar blok ${nr(idx)}${first ? ` (${first.name.toLowerCase()})` : ""} moeten handschoenen uit.`, blockIds: [b.id] });
  }

  // ——— Trainingsbelasting ———
  let run: number[] = [];
  const flushShoulder = () => {
    if (run.length >= 3) out.push({ id: `shoulders-${run[0]}`, level: "warning", area: "belasting", message: `Veel opeenvolgende schouderbelasting in ${range(run[0], run[run.length - 1])}.`, blockIds: run.map((i) => blocks[i].id) });
    run = [];
  };
  blocks.forEach((b, i) => {
    if (!b.placeholder && b.rpe[1] >= 8 && shoulderLoad(exs[i])) run.push(i);
    else flushShoulder();
  });
  flushShoulder();

  let legRun: number[] = [];
  blocks.forEach((b, i) => {
    if (heavyLegs(b, exs[i])) legRun.push(i);
    else {
      if (legRun.length >= 2) out.push({ id: `legs-${legRun[0]}`, level: "warning", area: "belasting", message: `Veel opeenvolgende beenspierbelasting in ${range(legRun[0], legRun[legRun.length - 1])}.`, blockIds: legRun.map((j) => blocks[j].id) });
      legRun = [];
    }
    if (i > 0 && heavyLegs(blocks[i - 1], exs[i - 1]) && hasKicks(exs[i]) && b.rpe[1] >= 7) {
      out.push({ id: `kicks-after-legs-${b.id}`, level: "warning", area: "belasting", message: `Blok ${nr(i)}: zware trappen direct na uitputtende beentraining.`, blockIds: [blocks[i - 1].id, b.id] });
    }
  });
  if (legRun.length >= 2) out.push({ id: `legs-${legRun[0]}`, level: "warning", area: "belasting", message: `Veel opeenvolgende beenspierbelasting in ${range(legRun[0], legRun[legRun.length - 1])}.`, blockIds: legRun.map((j) => blocks[j].id) });

  blocks.forEach((b, i) => {
    if (i === 0 || b.placeholder) return;
    const prev = blocks[i - 1];
    if (b.phase === "speed-power" && (prev.phase === "cardio" || prev.phase === "sc") && prev.rpe[1] >= 8 && blockSeconds(prev) >= 360) {
      out.push({ id: `power-after-fatigue-${b.id}`, level: "warning", area: "belasting", message: `Blok ${nr(i)}: maximale power gepland na ${formatDuration(blockSeconds(prev))} zware conditionele vermoeidheid.`, blockIds: [prev.id, b.id] });
    }
    if ((b.phase === "bag-basics" || b.phase === "skills") && prev.rpe[1] >= 9) {
      out.push({ id: `technique-after-fatigue-${b.id}`, level: "info", area: "belasting", message: `Blok ${nr(i)}: technisch werk direct na zeer zware inspanning. Techniek gaat voor vermoeidheid.`, blockIds: [b.id] });
    }
    const hard = exs[i].filter((e) => e.difficulty === 3).length;
    if (hard > 0 && b.rpe[1] >= 9) out.push({ id: `complex-${b.id}`, level: "warning", area: "belasting", message: `Blok ${nr(i)}: technisch complexe oefeningen onder zeer hoge vermoeidheid.`, blockIds: [b.id] });
  });
  blocks.forEach((b, i) => {
    if (!b.structure || b.placeholder) return;
    const explosive = b.phase === "speed-power" || b.goals.includes("explosiviteit");
    const { work, rest } = workRestPerParticipant(b.structure);
    if (explosive && work > 0 && rest < work) out.push({ id: `recovery-${b.id}`, level: "warning", area: "belasting", message: `Blok ${nr(i)}: weinig herstel bij explosief werk (${formatDuration(work)} werk, ${formatDuration(rest)} herstel).`, blockIds: [b.id] });
    const longest = Math.max(0, ...b.structure.intervals.filter((iv) => iv.kind === "work").map((iv) => iv.seconds));
    if (b.rpe[0] >= 9 && longest > 60) out.push({ id: `rpe-${b.id}`, level: "warning", area: "veiligheid", message: `Blok ${nr(i)}: RPE ${b.rpe[0]}+ langer dan 60 seconden volhouden is niet realistisch.`, blockIds: [b.id] });
  });
  const firstTen = blocks.filter((_, i) => (totals.blocks[i]?.start ?? 0) < 600);
  if (firstTen.some((b) => b.rpe[0] >= 8)) out.push({ id: "early-intensity", level: "warning", area: "belasting", message: "Zeer hoge intensiteit in de eerste 10 minuten: bouw eerst op." });
  if (blocks.length >= 3) {
    const hasWarm = blocks.slice(0, 2).some((b) => ["raise", "activate", "mobilize", "potentiate", "opening"].includes(b.phase));
    if (!hasWarm) out.push({ id: "no-warmup", level: "info", area: "veiligheid", message: "De les begint zonder warming-up." });
    const hasCool = blocks.slice(-2).some((b) => ["cooldown", "recovery", "core"].includes(b.phase));
    if (!hasCool) out.push({ id: "no-cooldown", level: "info", area: "veiligheid", message: "De les eindigt zonder cooling-down." });
  }

  // ——— Samenwerking ———
  const work = blocks.filter((b) => isWork(b) && !b.placeholder);
  if (work.length >= 2) {
    const partner = work.some((b) => ["tweetallen", "drietallen", "viertallen"].includes(b.organization) && (b.partnerRoles.trim() || (formatOf(b, lib)?.partnerInteraction ?? "laag") !== "laag"));
    if (!partner) out.push({ id: "no-partner", level: "info", area: "samenwerking", message: "Deze les bevat nog geen echte partnerinteractie." });
    const together = blocks.some((b) => b.phase === "team" || b.organization === "klassikaal" || b.goals.includes("groepsgevoel") || ["team", "groep"].includes(formatOf(b, lib)?.section ?? ""));
    if (!together) out.push({ id: "no-group", level: "info", area: "samenwerking", message: "Deze les bevat nog geen gezamenlijke opdracht." });
  }
  blocks.forEach((b, i) => {
    if (!b.placeholder && b.organization === "tweetallen" && b.equipment.includes("bokszak") && isWork(b) && !b.partnerRoles.trim()) {
      out.push({ id: `holder-${b.id}`, level: "info", area: "samenwerking", message: `Blok ${nr(i)}: de rol van de houder is niet beschreven.`, blockIds: [b.id] });
    }
  });

  // ——— Veiligheid ———
  blocks.forEach((b, i) => {
    if (b.gloves === "aan") {
      const floor = exs[i].filter((e) => e.gloves === "uit");
      if (floor.length) out.push({ id: `gloves-floor-${b.id}`, level: "warning", area: "veiligheid", message: `Blok ${nr(i)}: ${floor.map((e) => e.name).slice(0, 2).join(", ")} ${floor.length === 1 ? "is" : "zijn"} niet geschikt met bokshandschoenen.`, blockIds: [b.id] });
    }
    const f = formatOf(b, lib);
    const iso = exs[i].some((e) => e.pattern === "isometrisch");
    if (f && f.name === "You Go I Hold" && b.equipment.includes("bokszak") && iso) {
      out.push({ id: `hold-bag-${b.id}`, level: "info", area: "veiligheid", message: `Blok ${nr(i)}: een isometrische hold terwijl de partner de zak vasthoudt is niet realistisch. Kies holds zonder zak.`, blockIds: [b.id] });
    }
  });
  return out;
}
