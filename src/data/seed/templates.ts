import type { LessonTemplate } from "@/lib/domain/types";
import type { Goal, Phase } from "@/lib/domain/vocab";
import { slugify } from "@/lib/utils/text";
import { SEED_DATE } from "./meta";

type Slot = [title: string, phase: Phase, minutes: number, hint?: string];

interface TplSeed {
  name: string;
  description: string;
  focus: Goal[];
  slots: Slot[];
}

/** Lesstructuren van 60 minuten (masterprompt §21) + lege template + NextRound-geïnspireerde structuur. */
const TEMPLATES: TplSeed[] = [
  {
    name: "The Skills Lab", description: "Technische les met veel ruimte voor vaardigheden, reactie en partnerwerk.", focus: ["techniek", "reactie", "samenwerking"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 8, "Raise, activate, mobilize, potentiate"], ["Bag Basics", "bag-basics", 14], ["Skills & Reaction", "skills", 10], ["Speed & Power", "speed-power", 8], ["Partner Challenge", "team", 10], ["Core", "core", 5], ["Cooling-down", "cooldown", 3]],
  },
  {
    name: "Power House", description: "Explosieve stoot- en trapacties met power-conditionering.", focus: ["explosiviteit", "kracht", "conditie"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 8], ["Technische voorbereiding", "bag-basics", 10], ["Speed & Power", "speed-power", 10], ["Bag Endurance", "cardio", 8], ["Power Conditioning", "sc", 12], ["Teamchallenge", "team", 6], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Cardio Engine", description: "Conditiegerichte les met techniek als basis en een cardio-teamchallenge.", focus: ["conditie", "spieruithouding", "groepsgevoel"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 8], ["Basistechniek", "bag-basics", 8], ["Reactieve techniek", "skills", 8], ["Bag Intervals", "cardio", 8], ["Strength & Conditioning", "sc", 12], ["Cardio Teamchallenge", "team", 10], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Squad Saturday", description: "Samenwerking, partnercoaching en een grote gezamenlijke missie.", focus: ["samenwerking", "groepsgevoel", "plezier"],
    slots: [["Sociale opening", "opening", 2], ["RAMP", "raise", 8], ["Partner Coaching", "bag-basics", 10], ["Skills & Reaction", "skills", 8], ["Power", "speed-power", 8], ["Cardio", "cardio", 8], ["Shared Mission", "team", 12], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Back to Basics", description: "Eén fundamentele techniek centraal, met coaching en succeservaringen.", focus: ["techniek", "coordinatie"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 10], ["Fundamentele techniek", "bag-basics", 16], ["Toepassing op de zak", "bag-basics", 10], ["Reactieve spelvorm", "skills", 8], ["Partnerchallenge", "team", 6], ["Core", "core", 4], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "The Boxing Circuit", description: "Een groot circuit als hart van de les, omringd door techniek en power.", focus: ["conditie", "fullbody", "techniek"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 8], ["Techniek", "bag-basics", 8], ["Circuit", "sc", 18, "Bijvoorbeeld Four Corners of 40/20-stations"], ["Power", "speed-power", 8], ["Teamchallenge", "team", 8], ["Core", "core", 4], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Fight Night", description: "Teamuitdagingen in wedstrijdsfeer met een gezamenlijke finale.", focus: ["groepsgevoel", "plezier", "conditie"],
    slots: [["Intro & teamindeling", "opening", 2], ["RAMP", "raise", 8], ["Technische voorbereiding", "bag-basics", 10], ["Precision Challenge", "skills", 10], ["Power Endurance Challenge", "speed-power", 10], ["Teamfinale", "team", 12], ["Core", "core", 4], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Technique & Flow", description: "Techniek, voetenwerk en reactie in een vloeiende opbouw.", focus: ["techniek", "coordinatie", "reactie"],
    slots: [["Welkom", "opening", 2], ["RAMP", "raise", 8], ["Techniek", "bag-basics", 16], ["Voetenwerk", "skills", 10], ["Reactietraining", "skills", 8], ["Technische conditie", "cardio", 8], ["Core & mobiliteit", "core", 4], ["Cooling-down", "cooldown", 4]],
  },
  {
    name: "Klassieke opbouw", description: "De standaard lesflow: warming-up, techniek, power, conditie, team en afronding.", focus: ["techniek", "conditie", "groepsgevoel"],
    slots: [["Warming-up", "raise", 8], ["Bag Basics", "bag-basics", 12], ["Skills & Reaction", "skills", 8], ["Power", "speed-power", 8], ["Strength & Conditioning", "sc", 10], ["Team Challenge", "team", 8], ["Core & Cooling-down", "core", 6]],
  },
  {
    name: "Next Round (10 rondes)", description: "NextRound-geïnspireerde structuur in tien korte onderdelen met veel afwisseling.", focus: ["conditie", "techniek", "plezier"],
    slots: [["Welkom", "opening", 2], ["Raise", "raise", 3], ["Activate & Mobilize", "mobilize", 3], ["Potentiate", "potentiate", 2], ["Bag Basics", "bag-basics", 10], ["Skills & Reaction", "skills", 8], ["Speed & Power", "speed-power", 7], ["Strength & Conditioning", "sc", 10], ["Finisher / Team", "finisher", 8], ["Core & Cooling-down", "cooldown", 7]],
  },
  {
    name: "Lege les (60 min)", description: "Leeg canvas van 60 minuten: bouw zelf blok voor blok.", focus: [],
    slots: [],
  },
];

export const SEED_TEMPLATES: LessonTemplate[] = TEMPLATES.map((t) => {
  const id = `tpl-${slugify(t.name)}`;
  return {
    kind: "template",
    id,
    builtin: true,
    origin: "concept",
    sourceNote: "FightLab basisbibliotheek",
    name: t.name,
    description: t.description,
    focus: t.focus,
    slots: t.slots.map(([title, phase, minutes, hint], i) => ({ id: `${id}-s${i + 1}`, title, phase, durationSec: minutes * 60, ...(hint ? { hint } : {}) })),
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  };
});

export const EMPTY_TEMPLATE_ID = "tpl-lege-les-60-min";
