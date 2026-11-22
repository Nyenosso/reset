import type { Lesson, LessonBlock } from "@/lib/domain/types";
import type { Goal } from "@/lib/domain/vocab";
import { partnerAB as AB, structure as ST, continuous as CT } from "@/lib/time/presets";
import { slugify } from "@/lib/utils/text";
import { SEED_DATE } from "./meta";
import { buildBlockContent, type BlkSeed } from "./build-block";

interface LessonBlockSeed extends BlkSeed {
  source?: string;
}

interface LessonSeed {
  title: string;
  template: string;
  audience: string;
  goals: Goal[];
  notes: string;
  blocks: LessonBlockSeed[];
}

const RAMP_SOLO: LessonBlockSeed = {
  title: "RAMP Warming-up", phase: "raise", source: "blk-ramp-warming-up",
  ex: ["Jog in Place", "Boxer Bounce", "Shadowboxing Light", "Squat with Reach", "Reverse Lunge Hold", "Thoracic Rotations", "Hip Openers", "Jab-Cross on Count", "Front Kick Chamber", "Punch-Speed Build"],
  st: ST(1, [["Raise", "work", 120, "Jog in place → boxer bounce → shadowboxing light"], ["Activate", "work", 90, "Squat with reach · reverse lunge hold"], ["Mobilize", "work", 90, "Thoracic rotations · hip openers"], ["Potentiate", "work", 120, "1-2 op de tel · front kick chamber · punch-speed build"]], { explain: 0, transition: 60 }),
  org: "klassikaal", eq: "lichaamsgewicht", gl: "wisselend", rpe: [2, 6], g: "conditie,mobiliteit,techniek",
  instr: "Klassikaal zonder pauzes. Laatste minuut: handschoenen aan en naar de zak.", cues: ["Rustig opbouwen"],
};

const COOLDOWN: LessonBlockSeed = {
  title: "Cooling-down & Ademhaling", phase: "cooldown", source: "blk-cooling-down-ademhaling",
  ex: ["Easy Shadowboxing", "Kneeling Lunge Stretch", "Cross-Body Shoulder Stretch", "Child’s Pose", "Slow Controlled Breathing"],
  st: ST(1, [["Afbouwen", "work", 60, "Easy shadowboxing, tempo omlaag"], ["Rekken", "work", 120, "Heupbuigers · schouders · child’s pose"], ["Ademhaling + afsluiting", "work", 60, "4 tellen in, 6 uit · compliment aan je partner"]], { explain: 0 }),
  org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "herstel,mobiliteit,groepsgevoel",
  instr: "Klassikaal afbouwen en rekken; afsluiten met samen ademhalen.", cues: ["Lange uitademing"],
};

const LESSONS: LessonSeed[] = [
  {
    title: "Back to Basics — de 1-2-3-10", template: "tpl-back-to-basics", audience: "Gemengd niveau", goals: ["techniek", "coordinatie", "samenwerking"],
    notes: "Focus op één fundamentele combinatie (1-2-3-10). Veel succeservaringen; beginners mogen op 1-2-3 blijven.",
    blocks: [
      { title: "Welkom", phase: "opening", source: "blk-welkom-intro", ex: [["~Focus: de 1-2-3-10"], ["~Partner kiezen"]], st: CT(120, "Welkom", { explain: 0, text: "Doel van vandaag + partners" }), org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "groepsgevoel", instr: "Welkom. Vandaag draait alles om de 1-2-3-10: aan het eind kan iedereen hem zuiver slaan." },
      { ...RAMP_SOLO, title: "RAMP Warming-up (10 min)", st: ST(1, [["Raise", "work", 150, "Jog in place → boxer bounce → shadowboxing light"], ["Activate", "work", 120, "Squat with reach · reverse lunge hold · single-leg balance"], ["Mobilize", "work", 120, "Thoracic rotations · hip openers · controlled leg swings"], ["Potentiate", "work", 150, "1-2 op de tel · 1-2-3 shadowboxing · rear lowkick motion"]], { explain: 0, transition: 60 }), ex: [...RAMP_SOLO.ex, "Single-Leg Balance", "Controlled Leg Swings", "1-2-3 Shadowboxing", "Rear Lowkick Motion"] },
      { title: "Fundamentele techniek", phase: "bag-basics", format: "Technical Ladder", source: "blk-the-perfect-combination", ex: [["Single Jab", "ronde 1–2", "R1"], ["1-2", "ronde 3–4", "R2"], ["1-2-3", "ronde 5–6", "R3"], ["1-2-3-10", "ronde 7–10", "R4"]], st: AB(30, 10, 10, { reset: 10, explain: 90, transition: 70 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 6], g: "techniek,coordinatie", instr: "Trainer demonstreert de volledige 1-2-3-10 (90 sec). Twee rondes per trede; pas door als het zuiver is. Halverwege drinkpauze (in de overgang).", roles: "A slaat; B houdt de zak, controleert ‘hand terug naar de kin’ en geeft in de wissel één tip.", cues: ["De 2 laadt de 3", "De 3 laadt de 10"], easy: "Blijf op 1-2-3.", hard: "Voeg een uitstap toe na de 10." },
      { title: "Toepassing op de zak", phase: "bag-basics", format: "Quality Before Quantity", ex: [["1-2-3-10", "alleen zuivere herhalingen tellen"]], st: AB(30, 10, 6, { reset: 10, transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 7], g: "techniek", instr: "30 sec 1-2-3-10 op tempo. B telt alleen combinaties waarbij de guard na de trap direct terug is. Elke ronde: meer goede dan de vorige?", roles: "B telt hardop alleen de goede herhalingen.", cues: ["Kwaliteit is het getal"], easy: "1-2-3 tellen.", hard: "1-2-3-10-10." },
      { title: "Reactieve spelvorm", phase: "skills", format: "Captain’s Call", source: "blk-the-three-commands", ex: [["1-2-3-10", "basis", "BASIS"], ["Four Straight Burst", "", "SNEL"], ["Power Hooks", "", "POWER"], ["1-2 & Step Out", "", "UIT"]], st: AB(25, 5, 6, { transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 7], g: "reactie,plezier,samenwerking", instr: "A slaat doorlopend 1-2-3-10. B roept SNEL, POWER of UIT; daarna direct terug naar de basiscombinatie.", roles: "B is de captain.", cues: ["Na het commando terug naar de 1-2-3-10"], easy: "Basis 1-2.", hard: "Extra commando LAAG = 11-12." },
      { title: "Partnerchallenge", phase: "team", format: "Technical Streak", ex: [["1-2-3-10", "streak"]], st: AB(30, 10, 3, { reset: 10, explain: 45, transition: 75 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 8], g: "techniek,plezier,samenwerking", instr: "Hoeveel perfecte 1-2-3-10’s op rij? Bij een fout begint de streak opnieuw; de langste streak van het duo telt. Daarna handschoenen uit (in de overgang).", roles: "B telt de streak hardop.", cues: ["Rustig tempo verlengt de streak"], easy: "Streak met 1-2-3.", hard: "Streak met 1-2-3-10 + uitstap." },
      { title: "Duo Core", phase: "core", format: "You Go I Hold", source: "blk-duo-core", ex: [["Dead Bug", "", "A"], ["High Plank", "", "B"]], st: ST(3, [["A dead bug · B plank", "work", 30], ["Wissel", "switch", 5], ["B dead bug · A plank", "work", 30], ["Reset", "reset", 5]], { explain: 20, transition: 10 }), org: "tweetallen", eq: "lichaamsgewicht", gl: "uit", rpe: [5, 7], g: "kracht,samenwerking", instr: "Dead bug tegenover plank; wie plankt telt.", roles: "Wie plankt, telt de herhalingen van de partner.", cues: ["Onderrug plat"], easy: "Plank op de knieën.", hard: "Hollow hold." },
      COOLDOWN,
    ],
  },
  {
    title: "Power & Conditioning", template: "tpl-power-house", audience: "Gemengd tot gevorderd", goals: ["explosiviteit", "kracht", "conditie"],
    notes: "Explosieve stoot- en trapacties eerst (fris), daarna conditionele blokken. Power vóór vermoeidheid.",
    blocks: [
      { title: "Welkom", phase: "opening", source: "blk-welkom-intro", ex: [["~Focus: power en conditie"]], st: CT(120, "Welkom", { explain: 0 }), org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "groepsgevoel", instr: "Doel: explosief slaan en trappen, daarna conditie. Partners zoeken op vergelijkbare lengte." },
      RAMP_SOLO,
      { title: "Technische voorbereiding", phase: "bag-basics", format: "Slow-Medium-Fast", ex: [["1-2", "ronde 1–2"], ["1-2-3", "ronde 3–4"], ["1-2-10", "ronde 5–7"]], st: AB(30, 5, 7, { transition: 50 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 7], g: "techniek,snelheid", instr: "Elk interval: 10 sec slow motion, 10 sec normaal, 10 sec snel. Technische basis voor de power-blokken.", roles: "B houdt de zak en roept de tempowissels.", cues: ["Snel mag pas als langzaam perfect is"], easy: "Losse stoten.", hard: "1-2-3-10." },
      { title: "Speed & Power", phase: "speed-power", format: "Power Clusters", source: "blk-power-clusters", ex: [["Single Power Cross", "ronde 1–3"], ["Power Hooks", "ronde 4–5"], ["Power Lowkick", "ronde 6–8"]], st: AB(25, 5, 8, { transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "explosiviteit,kracht", instr: "Clusters van 3 power-slagen met 5 sec pauze. Ronde 1–3 crosses, 4–5 hoeken, 6–8 lowkicks. Drinkpauze in de overgang.", roles: "B houdt de zak stevig, staat aan de zijkant bij trappen.", cues: ["Elke slag maximaal", "Pauze echt nemen"], easy: "Clusters van 2.", hard: "Power-midkicks in de laatste ronde." },
      { title: "Bag Endurance", phase: "cardio", format: "Sprint & Cruise", source: "blk-sprint-cruise", ex: [["Continuous 1-2", "cruise"], ["Speed 1-2", "sprint"]], st: ST(5, [["A cruise + sprints", "work", 35], ["Wissel", "switch", 5], ["B cruise + sprints", "work", 35], ["Reset", "reset", 5]], { explain: 40, transition: 40 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [6, 9], g: "conditie,snelheid", instr: "Cruise op 60%, twee sprints per beurt op het signaal.", roles: "B houdt de zak.", cues: ["Cruise is nog steeds werk"], easy: "Eén sprint.", hard: "Sprints met hoeken." },
      { title: "Power Conditioning", phase: "sc", format: "Giant Set", source: "blk-fighter-conditioning", ex: [["Continuous 1-2", "30 sec"], ["Sprawl + 1-2", "30 sec"], ["Lowkick Repeater", "30 sec"], ["Squat Punches", "30 sec"]], st: ST(4, [["Continuous 1-2", "work", 30], ["Sprawl + 1-2", "work", 30], ["Lowkicks", "work", 30], ["Squat punches", "work", 30], ["Rust", "rest", 20]], { transition: 100 }), org: "individueel", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [8, 9], g: "conditie,fullbody,spieruithouding", instr: "Vier rondes van vier oefeningen zonder pauze. Per zak werken twee deelnemers om en om per oefening. Overgang: drinken en teams vormen.", roles: "Per zak: om en om per oefening; wie niet werkt houdt de zak.", cues: ["Doseer: het is een lange set"], easy: "Half burpee in plaats van sprawl.", hard: "Burpee + Eight Punches." },
      { title: "Teamchallenge", phase: "team", format: "Power Relay", ex: [["Single Power Cross", "om de beurt"]], st: ST(4, [["Estafette", "work", 30], ["Rust", "rest", 30]], { transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "samenwerking,explosiviteit", instr: "30 sec om de beurt één power-cross; tel de goede stoten van het duo. Daarna handschoenen uit.", roles: "Partners tikken elkaar aan na elke stoot.", cues: ["Elke slag maximaal, ook onder tijdsdruk"], easy: "Om de beurt twee slagen.", hard: "Power-lowkicks." },
      COOLDOWN,
    ],
  },
  {
    title: "Squad Saturday — Power & Teamwork", template: "tpl-squad-saturday", audience: "Gemengd niveau", goals: ["samenwerking", "groepsgevoel", "conditie"],
    notes: "Communitygerichte les: nieuwe partners, veel partnercommando’s en een gezamenlijke missie.",
    blocks: [
      { title: "Sociale opening", phase: "opening", format: "Community Round", ex: [["~Partner zoeken die je nog niet kent"], ["~Naam + ‘wat wil je vandaag winnen?’"]], st: CT(120, "Kennismaken", { explain: 0 }), org: "tweetallen", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "groepsgevoel", instr: "Kies een partner die je nog niet kent. Vertel je naam en wat je vandaag wilt winnen." },
      { title: "Partner RAMP", phase: "raise", format: "You Lead I Follow", source: "blk-partner-ramp", ex: ["Boxer Bounce", "Shadowboxing Light", "Squat with Reach", "Single-Leg Balance", "Arm Swings", "Lunge & Twist", "Reaction Jab", "Jab-Cross on Count"], st: ST(1, [["Raise: spiegelen", "work", 120], ["Activate", "work", 90], ["Mobilize", "work", 90], ["Potentiate", "work", 120]], { explain: 0, transition: 60 }), org: "tweetallen", eq: "lichaamsgewicht", gl: "wisselend", rpe: [2, 6], g: "groepsgevoel,mobiliteit,reactie", instr: "Tegenover elkaar: spiegelen, activeren, mobiliseren, reactie-jabs. Laatste minuut handschoenen aan.", roles: "Elke 30 sec wisselt de leider.", cues: ["Kijk elkaar aan"] },
      { title: "Partner Coaching", phase: "bag-basics", format: "Partner Feedback", ex: [["1-2-3", "ronde 1–3"], ["1-2-10", "ronde 4–6"]], st: AB(30, 15, 6, { reset: 15 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 6], g: "techniek,samenwerking,groepsgevoel", instr: "Na elk interval: ‘Goed: …’ en ‘Let op: …’. Eerst het compliment.", roles: "B observeert en geeft in de wissel één compliment en één tip.", cues: ["Eerst het compliment"], easy: "Alleen complimenten.", hard: "Tip moet concreet en uitvoerbaar zijn." },
      { title: "Skills & Reaction — The Three Commands", phase: "skills", format: "Captain’s Call", source: "blk-the-three-commands", ex: [["1-2", "doorlopend", "BASIS"], ["Four Straight Burst", "", "SNEL"], ["Power Hooks", "", "POWER"], ["1-2 & Step Out", "", "UIT"]], st: AB(25, 5, 6, { transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 7], g: "reactie,samenwerking,plezier", instr: "SNEL = vier snelle rechte, POWER = twee krachtige hoeken, UIT = uitstappen.", roles: "B is de captain.", cues: ["Captain: varieer je timing"], easy: "Twee commando’s.", hard: "Commando LAAG erbij." },
      { title: "Power", phase: "speed-power", format: "Partner Trigger", ex: [["Speed 1-2", "burst 3–5 sec"], ["Single Power Cross", "laatste 2 rondes"]], st: AB(25, 5, 6, { explain: 45, transition: 75 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "explosiviteit,reactie", instr: "A wacht in guard; op de tik van B volgt een burst. Laatste twee rondes: één maximale cross per tik. Drinkpauze in de overgang.", roles: "B is de trigger: wisselende momenten, duidelijk tikken.", cues: ["Ontspannen wachten = sneller"], easy: "Burst van 3 sec.", hard: "Trigger bepaalt de techniek." },
      { title: "Cardio", phase: "cardio", format: "Beat Your Best Together", ex: [["Continuous 1-2", "duototaal"]], st: AB(30, 10, 5, { reset: 10, explain: 45, transition: 35 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "conditie,samenwerking,groepsgevoel", instr: "Tel de stoten van A + B in ronde 1. Elke volgende ronde moet het duototaal hoger zijn.", roles: "Wie niet werkt, telt hardop.", cues: ["Jullie getal, samen"], easy: "Tel combinaties.", hard: "Alleen perfecte combinaties." },
      { title: "Shared Mission", phase: "team", format: "Shared Mission", source: "blk-shared-mission", ex: [["Continuous 1-2", "400"], ["Rear Lowkick", "80"], ["Air Squat", "60"], ["Half Burpee", "20"]], st: CT(540, "Missie", { explain: 75, transition: 105, text: "400 stoten · 80 lowkicks · 60 squats · 20 half burpees" }), org: "tweetallen", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [7, 9], g: "samenwerking,groepsgevoel,conditie", instr: "Elk duo: 400 stoten, 80 lowkicks, 60 squats en 20 half burpees in 9 minuten. Wie klaar is, gaat bij een ander duo tellen en aanmoedigen. Daarna handschoenen uit en applaus voor de zaal.", roles: "Eén werkt, de ander houdt de zak en telt; vrij wisselen.", cues: ["Maak eerst een plan", "Klaar = helper worden"], easy: "300 / 60 / 40 / 10.", hard: "Volledige burpees." },
      { ...COOLDOWN, title: "Cooling-down & Victory Lap", ex: [...COOLDOWN.ex, ["~Victory lap: tik drie mensen met een compliment"]], instr: "Afbouwen en rekken; afsluiten met de victory lap: tik handschoenen (of handen) met drie anderen met een compliment." },
    ],
  },
  {
    title: "Fight Night", template: "tpl-fight-night", audience: "Gemengd niveau, teams van vier", goals: ["groepsgevoel", "plezier", "conditie"],
    notes: "Wedstrijdsfeer met teams van vier (twee zakken per team), scorebord op het whiteboard en een gezamenlijke finale.",
    blocks: [
      { title: "Intro & teamindeling", phase: "opening", format: "Team Captain", ex: [["~Teams van vier, teamnaam kiezen"], ["~Scorebord op het whiteboard"]], st: CT(120, "Intro", { explain: 0 }), org: "viertallen", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "groepsgevoel,plezier", instr: "Teams van vier (gemengd niveau), teamnaam en captain kiezen. Uitleg van het scorebord." },
      RAMP_SOLO,
      { title: "Technische voorbereiding", phase: "bag-basics", format: "Technical Ladder", ex: [["1-2", "ronde 1–2"], ["1-2-3", "ronde 3–4"], ["1-2-3-10", "ronde 5–6"], ["1-2-11-10", "ronde 7–8"]], st: AB(25, 5, 8, { transition: 60 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 7], g: "techniek,coordinatie", instr: "Bereid de combinaties van vanavond voor. Binnen het team in duo’s.", roles: "B houdt de zak en controleert de guard.", cues: ["Zuiver voor de challenges"], easy: "Tot 1-2-3.", hard: "1-2-3-10-10." },
      { title: "Precision Challenge", phase: "skills", format: "Accuracy First", ex: [["1-2", "op de tape"], ["Accuracy Power", "laatste ronde"]], st: AB(30, 15, 5, { reset: 15, explain: 75, transition: 75 }), org: "tweetallen", eq: "bokszak,pads", gl: "aan", rpe: [5, 7], g: "techniek,coordinatie,plezier", instr: "Tape op de zak. Raak = +1, mis = −1. Teamscore = som van alle teamleden. Laatste ronde: power op het doel.", roles: "Partner telt raak en mis; captain meldt de teamscore.", cues: ["Langzamer = vaker raak"], easy: "Groter doel.", hard: "Doel op wisselende hoogte." },
      { title: "Power Endurance Challenge", phase: "speed-power", format: "Squad Battle", ex: [["Speed 1-2", "uitdaging 1"], ["Power Lowkick", "uitdaging 2"], ["Squat Hold", "uitdaging 3"], ["1-2-3-10", "uitdaging 4"]], st: ST(4, [["Uitdaging", "work", 90], ["Score + wissel", "switch", 30]], { transition: 60 }), org: "viertallen", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [7, 9], g: "conditie,explosiviteit,groepsgevoel", instr: "Vier uitdagingen van 90 sec: max stoten · power-lowkicks · squat hold (langste team) · perfecte 1-2-3-10’s. Punten per uitdaging.", roles: "Twee duo’s per team; wie niet werkt telt en moedigt aan.", cues: ["Teamleden bij naam aanmoedigen"], easy: "Kortere uitdagingen.", hard: "Joker-uitdaging met dubbele punten." },
      { title: "Teamfinale", phase: "team", format: "Fight Night", ex: [["Freestyle with Minimum", "ronde 1"], ["Power Combo Reset", "ronde 2"], ["Boxing Flurry", "ronde 3"]], st: ST(3, [["Ronde", "work", 120], ["Hoek", "switch", 60]], { transition: 120 }), org: "viertallen", eq: "bokszak", gl: "aan", rpe: [8, 10], g: "groepsgevoel,plezier,conditie", instr: "Drie ‘rondes’ met hoekoverleg. Ronde 1: vrij met minimumeisen · ronde 2: power-combinaties tellen · ronde 3: alles. Na afloop eindstand, handschoenen uit en drinken.", roles: "Per team: twee boksers, twee cornercoaches; wisselen per ronde.", cues: ["Hoekoverleg: één plan"], easy: "Rondes van 90 sec.", hard: "Coaches bepalen de tactiek." },
      { title: "Core", phase: "core", format: "Hold the Line", ex: [["Squat Hold", "teamhold"], ["High Plank"], ["Hollow Hold"]], st: ST(1, [["Hold the line", "work", 60], ["Wissel", "switch", 10], ["Plank", "work", 60], ["Rust", "rest", 20], ["Hollow hold", "work", 40]], { explain: 20, transition: 30 }), org: "viertallen", eq: "lichaamsgewicht", gl: "uit", rpe: [6, 8], g: "spieruithouding,groepsgevoel", instr: "Team houdt samen een squat hold (laat iemand los, dan begint de klok opnieuw), daarna plank en hollow hold.", roles: "Het team moedigt elkaar bij naam aan.", cues: ["Samen volhouden"], easy: "Knieën op de vloer bij de plank.", hard: "Hollow rock." },
      { ...COOLDOWN, title: "Cooling-down & prijsuitreiking", instr: "Afbouwen, rekken en ademhalen; daarna de eindstand en applaus voor alle teams." },
    ],
  },
];

export const SEED_LESSONS: Lesson[] = LESSONS.map((l) => {
  const id = `les-${slugify(l.title)}`;
  const blocks: LessonBlock[] = l.blocks.map((b, i) => {
    const bid = `${id}-b${i + 1}`;
    const { source, ...rest } = b;
    return { id: bid, ...(source ? { sourceBlockId: source } : {}), ...buildBlockContent(rest, bid) };
  });
  return {
    id,
    title: l.title,
    audience: l.audience,
    participants: 20,
    targetSec: 3600,
    organization: "tweetallen",
    equipment: ["bokszak", "pads", "trapkussen", "slamball", "gewichtjes", "flexibeam", "lichaamsgewicht"],
    goals: l.goals,
    templateId: l.template,
    status: "concept",
    favorite: false,
    notes: l.notes,
    blocks,
    exampleId: id,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  };
});
