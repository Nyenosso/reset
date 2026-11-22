import type { TrainingBlock } from "@/lib/domain/types";
import { partnerAB as AB, structure as ST, continuous as CT } from "@/lib/time/presets";
import { slugify } from "@/lib/utils/text";
import { SEED_DATE } from "./meta";
import { buildBlockContent, type BlkSeed } from "./build-block";

interface BlockSeed extends BlkSeed {
  d: string;
  tags?: string;
}

/** Twintig kernblokken uit de masterprompt (§20) plus extra bouwstenen voor complete lessen. */
const BLOCKS: BlockSeed[] = [
  {
    title: "The Perfect Combination", d: "Van jab naar 1-2-3-10: stap voor stap een perfecte combinatie opbouwen.", phase: "bag-basics", format: "Technical Ladder",
    ex: [["1-2", "ronde 1", "R1"], ["1-2-3", "ronde 2", "R2"], ["1-2-3-10", "ronde 3–5", "R3"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 6], g: "techniek,coordinatie",
    instr: "Bouw de combinatie per ronde op. Pas naar de volgende trede als de vorige zuiver is. Laatste drie rondes: 1-2-3-10 met aandacht voor de terugkeer in stand.",
    roles: "A slaat; B houdt de zak en controleert één punt: komt de hand na elke stoot terug bij de kin?",
    cues: ["De 2 laadt de 3, de 3 laadt de 10", "Na de trap direct terug in guard"], easy: "Blijf op 1-2-3.", hard: "Sluit af met een uitstap (Lowkick & Exit).", tags: "techniek",
  },
  {
    title: "The Quality Ladder", d: "Een technische ladder waarin alleen zuivere herhalingen tellen.", phase: "bag-basics", format: "Quality Before Quantity",
    ex: [["Single Jab", "", "1"], ["1-2", "", "2"], ["1-2-3", "", "3"], ["1-2-3-2", "", "4"], ["1-2-3-10", "", "5"], ["1-2-11-10", "", "6"], ["~Vrije keuze uit de ladder", "", "7"]],
    st: AB(25, 5, 7), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 7], g: "techniek",
    instr: "Elke ronde een trede hoger. B telt alleen herhalingen waarbij beide handen terugkomen. Doel: meer goede herhalingen dan de vorige ronde.",
    roles: "B houdt de zak en telt hardop alleen de goede herhalingen.",
    cues: ["Kwaliteit is het getal", "Rustig tempo levert meer goede herhalingen op"], easy: "Stop bij trede 4.", hard: "Trede 7: 1-2-3-10-10.", tags: "techniek,kwaliteit",
  },
  {
    title: "Distance Detective", d: "Afstand meten en herstellen: in, actie, uit.", phase: "skills", format: "Distance Reset",
    ex: ["Step In-Step Out", "Jab + Step Back", ["1-2-10", "met afstandscheck"], "Lowkick & Exit"],
    st: AB(25, 5, 4), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 6], g: "techniek,coordinatie",
    instr: "Na elke combinatie stap je buiten bereik en meet je opnieuw met een jab-aanraking. Ronde 3–4: met de lowkick op de juiste (grotere) afstand.",
    roles: "B houdt de zak en zegt ‘te dicht’ of ‘te ver’.", cues: ["Trapafstand is groter dan stootafstand", "Kleine passen"], easy: "Alleen stoten.", hard: "Combinatie met uitstap en pivot.", tags: "voetenwerk,afstand",
  },
  {
    title: "The Three Commands", d: "Captain’s Call met drie commando’s: SNEL, POWER en UIT.", phase: "skills", format: "Captain’s Call",
    ex: [["1-2", "doorlopend", "BASIS"], ["Four Straight Burst", "4 snelle rechte", "SNEL"], ["Power Hooks", "2 krachtige hoeken", "POWER"], ["1-2 & Step Out", "uitstappen", "UIT"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 7], g: "reactie,samenwerking,plezier",
    instr: "1 minuut uitleg. A bokst doorlopend 1-2. B roept minstens vier commando’s per interval: SNEL = vier snelle rechte stoten, POWER = twee krachtige hoeken, UIT = uitstappen.",
    roles: "B is de captain: houdt de zak en kiest het moment van elk commando.", cues: ["Captain: varieer je timing", "Na elk commando terug naar 1-2"], easy: "Alleen SNEL en UIT.", hard: "Vierde commando LAAG = 11-12.", tags: "reactie,partner",
  },
  {
    title: "The Memory Challenge", d: "Een groeiende reeks combinaties onthouden en foutloos uitvoeren.", phase: "skills", format: "Memory Sequence",
    ex: [["1-2", "", "1"], ["11-12-3", "", "2"], ["1-2-10", "", "3"], ["Slip-Cross", "", "4"], ["1-2-3-10", "", "5"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 7], g: "reactie,coordinatie,techniek",
    instr: "Elke ronde komt er een combinatie bij; A voert de volledige reeks in volgorde uit en herhaalt die tot het interval voorbij is.",
    roles: "B roept de nieuwe combinatie en controleert de volgorde.", cues: ["Zeg de reeks zacht mee", "Rustig is sneller dan fout"], easy: "Maximaal drie combinaties.", hard: "B kiest de nieuwe combinatie zelf.", tags: "reactie,geheugen",
  },
  {
    title: "Freeze & Fire", d: "Schaduwboksen voor de zak, op FIRE alles erop, op FREEZE stilstaan in perfecte guard.", phase: "skills", format: "Shadow & Fire",
    ex: ["Shadowboxing Light", ["Speed 1-2", "op FIRE, 3 sec"], ["Freeze & Guard", "op FREEZE"]],
    st: AB(25, 5, 4), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [5, 8], g: "reactie,snelheid",
    instr: "A schaduwbokst vlak voor de zak zonder te raken. Op ‘FIRE’ drie seconden alles op de zak; op ‘FREEZE’ binnen één seconde stilstaan in perfecte guard.",
    roles: "B houdt de zak en roept FIRE en FREEZE op onvoorspelbare momenten.", cues: ["Ontspannen wachten", "Freeze = kin omlaag, handen hoog"], easy: "Alleen FIRE.", hard: "FIRE met een vaste combinatie.", tags: "reactie",
  },
  {
    title: "Power Clusters", d: "Clusters van drie maximale stoten met korte pauzes: kwaliteit per stoot.", phase: "speed-power", format: "Power Clusters",
    ex: [["Single Power Cross", "3–3–3"], ["Power Hooks", "ronde 3–4"], ["Power Lowkick", "ronde 5"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "explosiviteit,kracht",
    instr: "Per interval: 3 power-slagen – 5 sec pauze – 3 – 5 sec – 3. Ronde 1–2 crosses, ronde 3–4 hoeken, ronde 5 lowkicks.",
    roles: "B houdt de zak stevig en telt de clusters.", cues: ["Elke slag volle kinetische keten", "Pauze echt nemen"], easy: "Clusters van twee.", hard: "Laatste ronde power-midkicks.", tags: "power",
  },
  {
    title: "Speed to Power", d: "Power-uithouding: snelle reeksen afgesloten met een zware stoot, en omgekeerd.", phase: "speed-power", format: "Contrast Training",
    ex: [["Speed-to-Power", "ronde 1–2"], ["Power-to-Speed", "ronde 3–4"]],
    st: AB(25, 5, 4), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [7, 9], g: "explosiviteit,snelheid,conditie",
    instr: "Ronde 1–2: vier snelle rechte stoten + één power-cross, herhalen. Ronde 3–4: één power-cross + vier snelle stoten.",
    roles: "B houdt de zak en roept ‘nog 5!’ in de laatste seconden.", cues: ["Snel = ontspannen", "Power = heup"], easy: "Twee snelle + één zware.", hard: "Afsluiten met een power-lowkick.", tags: "power,snelheid",
  },
  {
    title: "Kick Power", d: "Maximale trappen in een opbouwende ladder.", phase: "speed-power", format: "Power Ladder",
    ex: [["Power Lowkick", "1-2-3"], ["Double Rear Lowkick", "ronde 4"], ["Power Teep", "ronde 5"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak,trapkussen", gl: "aan", rpe: [7, 9], g: "explosiviteit,techniek",
    instr: "Ronde 1–3: power-ladder 1-2-3 lowkicks met reset. Ronde 4: dubbele lowkicks. Ronde 5: power-teeps.",
    roles: "B houdt de zak met beide armen stevig vast en staat aan de zijkant, buiten de trap.", cues: ["Uitstappen voor de trap", "Na elke trap terug in stand"], easy: "Lowkicks op 70%.", hard: "Power-midkicks in ronde 5.", tags: "trappen,power",
  },
  {
    title: "Boxer Legs", d: "Benen van een bokser: hold, sprong en bob & weave in één circuit.", phase: "sc", format: "Tri-set",
    ex: [["Squat Punches", "20 sec"], ["Jump Squat + Guard", "15 sec"], ["Bob & Weave", "15 sec"]],
    st: ST(5, [["Squat punches", "work", 20], ["Jump squats", "work", 15], ["Bob & weave", "work", 15], ["Rust", "rest", 10]]), org: "individueel", eq: "lichaamsgewicht", gl: "aan", rpe: [7, 8], g: "spieruithouding,kracht,explosiviteit",
    instr: "Vijf rondes: 20 sec stoten in een halve squat, 15 sec jump squats met guard, 15 sec bob & weave, 10 sec rust. Iedereen tegelijk naast de eigen zak.",
    cues: ["Laag blijven", "Zacht landen"], easy: "Explosive squats in plaats van jump squats.", hard: "Jumping lunges.", notes: "Plan na dit blok geen zware trappen direct: de benen zijn moe.", tags: "benen",
  },
  {
    title: "You Go I Hold", d: "Partner-S&C: één werkt dynamisch, de ander houdt een hold vast.", phase: "sc", format: "You Go I Hold",
    ex: [["Air Squat", "10×", "A"], ["Squat Hold", "hold", "B"], ["Push-up", "8×", "A"], ["High Plank", "hold", "B"]],
    st: ST(3, [["A dynamisch · B hold", "work", 50, "10 squats + 8 push-ups"], ["Wissel", "switch", 10], ["B dynamisch · A hold", "work", 50], ["Reset", "reset", 10]], { setup: 60 }), org: "tweetallen", eq: "lichaamsgewicht", gl: "uit", rpe: [6, 8], g: "spieruithouding,samenwerking,kracht",
    instr: "Handschoenen uit (1 minuut). A doet 10 squats en 8 push-ups terwijl B een squat hold en daarna een plank vasthoudt. Wissel zodra A klaar is.",
    roles: "Wie de hold doet, telt hardop de herhalingen van de partner. Niemand houdt de zak vast.", cues: ["Werk vlot: je partner hangt in de hold", "Hold actief, niet hangen"], easy: "Knee push-ups en half squat hold.", hard: "Jump squats en tempo push-ups.", tags: "partner,kracht",
  },
  {
    title: "Fighter Conditioning", d: "Full-body vechtersconditie zonder handschoenwissel.", phase: "sc", format: "Giant Set",
    ex: [["Continuous 1-2", "30 sec"], ["Sprawl + 1-2", "30 sec"], ["Lowkick Repeater", "30 sec"], ["Squat Punches", "30 sec"]],
    st: ST(3, [["Continuous 1-2", "work", 30], ["Sprawl + 1-2", "work", 30], ["Lowkicks", "work", 30], ["Squat punches", "work", 30], ["Rust", "rest", 20]]), org: "tweetallen", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [8, 9], g: "conditie,fullbody,spieruithouding",
    instr: "Drie rondes van vier oefeningen à 30 sec zonder pauze, 20 sec rust. Per zak twee deelnemers: zakwerk (1-2, lowkicks) en vloerwerk (sprawl, squat punches) wisselen elkaar af, zodat niemand op een zak hoeft te wachten.",
    roles: "Tijdens zakwerk van A doet B het vloerwerk naast de zak; volgende oefening omgekeerd.",
    cues: ["Doseer: het is een lange set", "Sprawl: heupen naar de vloer"], easy: "Half burpee in plaats van sprawl.", hard: "Burpee + Eight Punches als tweede oefening.", tags: "conditie,fullbody",
  },
  {
    title: "Cardio Waves", d: "Golven van snel en rustig binnen elke ronde.", phase: "cardio", format: "Fast-Slow Waves",
    ex: [["Continuous 1-2", "rustig"], ["Speed 1-2", "snel"], ["Continuous Hooks", "ronde 3"]],
    st: AB(60, 10, 3, { reset: 10 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [6, 8], g: "conditie",
    instr: "Per beurt 60 sec: 15 snel – 15 rustig – 15 snel – 15 rustig. Ronde 3 met hoeken.",
    roles: "B houdt de zak en roept de wissels ‘SNEL’ en ‘RUSTIG’ af.", cues: ["Rustig blijft doorgaan", "Snel = ontspannen schouders"], easy: "10 sec snel.", hard: "20 sec snel.", tags: "cardio",
  },
  {
    title: "The Consistency Test", d: "Elk interval hetzelfde aantal stoten: constantheid wint.", phase: "cardio", format: "Even Pace Challenge",
    ex: [["Continuous 1-2", "eigen doelgetal"]],
    st: AB(25, 5, 5), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [6, 8], g: "conditie,techniek",
    instr: "A kiest een doelgetal per interval (bijvoorbeeld 35). B telt; een afwijking van meer dan drie levert geen punt op. Wie haalt vijf punten?",
    roles: "B telt hardop per vier stoten en meldt het getal.", cues: ["Vind je ritme in de eerste ronde", "Gelijkmatig ademen"], easy: "Afwijking tot vijf.", hard: "Afwijking tot twee.", tags: "cardio,tempo",
  },
  {
    title: "Shared Mission", d: "Een gezamenlijke duo-missie: samen plannen, samen halen.", phase: "team", format: "Shared Mission",
    ex: [["Continuous 1-2", "300"], ["Rear Lowkick", "60"], ["Air Squat", "40"]],
    st: CT(420, "Missie", { text: "300 stoten · 60 lowkicks · 40 squats" }), org: "tweetallen", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [7, 9], g: "samenwerking,groepsgevoel,conditie",
    instr: "1 minuut uitleg en plan maken. Daarna 7 minuten: samen 300 stoten, 60 lowkicks en 40 squats. Vrij verdelen, één persoon tegelijk aan het werk.",
    roles: "Wie niet werkt houdt de zak, telt en moedigt aan.", cues: ["Spreek een wisselplan af", "Tel hardop"], easy: "200 / 40 / 30.", hard: "Voeg 20 burpees toe.", tags: "team",
  },
  {
    title: "Squad Rescue", d: "Viertallen redden elkaar door herhalingen over te nemen.", phase: "team", format: "Squad Rescue",
    ex: [["Continuous 1-2", "100 p.p."], ["Air Squat", "40 p.p."], ["Half Burpee", "20 p.p."]],
    st: CT(480, "Missie met reddingen", { setup: 60 }), org: "viertallen", eq: "bokszak,lichaamsgewicht", gl: "aan", rpe: [7, 9], g: "samenwerking,groepsgevoel,conditie",
    instr: "Viertallen vormen (1 minuut). Ieder: 100 stoten, 40 squats en 20 half burpees. Roep ‘RESCUE’ en een teamgenoot neemt 10 herhalingen over; elke redding betaal je later terug.",
    roles: "Teamleden houden elkaar in de gaten en springen bij; twee zakken per viertal.", cues: ["Hulp vragen is sterk", "Terugbetalen niet vergeten"], easy: "Ieder 60 / 30 / 10.", hard: "Maximaal twee reddingen per persoon.", tags: "team,samenwerking",
  },
  {
    title: "The Rematch", d: "Test, training en rematch in één blok: zichtbare progressie.", phase: "team", format: "The Rematch",
    ex: [["Speed 1-2", "test"], ["1-2", "techniektraining"], ["Speed 1-2", "rematch"]],
    st: ST(1, [["A test", "work", 30], ["Wissel", "switch", 10], ["B test", "work", 30], ["Tip", "rest", 30], ["A training", "work", 45], ["Wissel", "switch", 10], ["B training", "work", 45], ["Tip", "rest", 30], ["A rematch", "work", 30], ["Wissel", "switch", 10], ["B rematch", "work", 30], ["Score", "reset", 20]], { transition: 40 }),
    org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [6, 9], g: "plezier,groepsgevoel,snelheid",
    instr: "Test: 30 sec max stoten (partner telt). Daarna 45 sec gerichte training met de tip van de partner. Rematch: dezelfde test. Wie verbetert?",
    roles: "B telt, geeft één tip en benoemt aan het eind de verbetering.", cues: ["Tip = één concreet punt", "Vier de verbetering"], easy: "Tel combinaties in plaats van stoten.", hard: "Alleen technisch zuivere stoten tellen.", tags: "progressie",
  },
  {
    title: "Duo Core", d: "Core in tweetallen: één werkt dynamisch, de ander houdt vast.", phase: "core", format: "You Go I Hold",
    ex: [["Dead Bug", "A"], ["High Plank", "B"], ["Bicycle Crunch", "ronde 3–4"]],
    st: ST(4, [["A dead bug · B plank", "work", 30], ["Wissel", "switch", 5], ["B dead bug · A plank", "work", 30], ["Reset", "reset", 5]], { explain: 20 }), org: "tweetallen", eq: "lichaamsgewicht", gl: "uit", rpe: [5, 7], g: "kracht,spieruithouding,samenwerking",
    instr: "Ronde 1–2: dead bug tegenover plank. Ronde 3–4: bicycle crunch tegenover plank. Handschoenen zijn al uit.",
    roles: "Wie plankt, telt de herhalingen van de partner.", cues: ["Onderrug plat", "Plank: billen aan"], easy: "Knieën op de vloer bij de plank.", hard: "Hollow hold in plaats van plank.", tags: "core,partner",
  },
  {
    title: "The Final Bell", d: "Afsluiter: drie rondes sprinten tot de bel.", phase: "finisher", format: "Final Bell Sprint",
    ex: [["Continuous 1-2", "0–10 sec"], ["Speed 1-2", "10–20 sec"], ["Boxing Flurry", "20–30 sec"]],
    st: ST(3, [["A: sprint tot de bel", "work", 30], ["Wissel", "switch", 5], ["B: sprint tot de bel", "work", 30], ["Reset", "reset", 5]], { explain: 30 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [8, 10], g: "conditie,plezier",
    instr: "Elke 30 sec in drie versnellingen: stevig, harder, alles. De trainer luidt de ‘bel’.",
    roles: "B houdt de zak en telt de laatste 5 seconden hardop af.", cues: ["Versnel in drie stappen", "Alles eruit tot de bel"], easy: "Twee rondes.", hard: "Laatste 10 sec met lowkicks.", tags: "finisher",
  },
  {
    title: "Sprint & Cruise", d: "Cruisen op tempo met sprints op het signaal van de trainer.", phase: "cardio", format: "Sprint & Cruise",
    ex: [["Continuous 1-2", "cruise"], ["Speed 1-2", "sprint 10 sec"]],
    st: ST(4, [["A cruise + sprints", "work", 35], ["Wissel", "switch", 5], ["B cruise + sprints", "work", 35], ["Reset", "reset", 5]], { explain: 40 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [6, 9], g: "conditie,snelheid",
    instr: "Cruise met 1-2 op 60%; op ‘SPRINT’ tien seconden alles, daarna terug naar cruise. Twee sprints per beurt.",
    roles: "B houdt de zak; de trainer roept de sprints.", cues: ["Cruise is nog steeds werk", "Sprint = ontspannen schouders"], easy: "Eén sprint per beurt.", hard: "Sprints met hoeken.", tags: "cardio",
  },
  // ——— Extra bouwstenen ———
  {
    title: "RAMP Warming-up", d: "Complete warming-up van 8 minuten: Raise, Activate, Mobilize, Potentiate.", phase: "raise", format: "Escalator",
    ex: [["Jog in Place", "", "R"], ["Boxer Bounce", "", "R"], ["Shadowboxing Light", "", "R"], ["Squat with Reach", "", "A"], ["Reverse Lunge Hold", "", "A"], ["Thoracic Rotations", "", "M"], ["Hip Openers", "", "M"], ["Jab-Cross on Count", "", "P"], ["Front Kick Chamber", "", "P"], ["Punch-Speed Build", "", "P"]],
    st: ST(1, [["Raise", "work", 120, "Jog in place → boxer bounce → shadowboxing light"], ["Activate", "work", 90, "Squat with reach · reverse lunge hold"], ["Mobilize", "work", 90, "Thoracic rotations · hip openers"], ["Potentiate", "work", 120, "1-2 op de tel · front kick chamber · punch-speed build"]], { explain: 0, transition: 60 }),
    org: "klassikaal", eq: "lichaamsgewicht", gl: "wisselend", rpe: [2, 6], g: "conditie,mobiliteit,techniek",
    instr: "De trainer leidt klassikaal, zonder pauzes tussen de fasen. Na de potentiate-fase handschoenen aan en naar de zak (1 minuut).",
    cues: ["Rustig opbouwen", "Potentiate al op lesniveau"], easy: "Lage impact in de raise-fase.", hard: "Potentiate met jump squats.", notes: "Handschoenen pas aan na de warming-up.", tags: "warming-up",
  },
  {
    title: "Partner RAMP", d: "Warming-up in tweetallen met kennismaking en spiegelopdrachten.", phase: "raise", format: "You Lead I Follow",
    ex: [["Boxer Bounce", "", "R"], ["Shadowboxing Light", "spiegelen", "R"], ["Squat with Reach", "", "A"], ["Single-Leg Balance", "met high five", "A"], ["Arm Swings", "", "M"], ["Lunge & Twist", "", "M"], ["Reaction Jab", "partner geeft signaal", "P"], ["Jab-Cross on Count", "", "P"]],
    st: ST(1, [["Raise: spiegelen", "work", 120, "Partner leidt, jij volgt; elke 30 sec wisselen"], ["Activate", "work", 90, "Squat with reach · single-leg balance met high five"], ["Mobilize", "work", 90, "Arm swings · lunge & twist tegenover elkaar"], ["Potentiate", "work", 120, "Reaction jab op signaal partner · 1-2 op de tel"]], { explain: 0, transition: 60 }),
    org: "tweetallen", eq: "lichaamsgewicht", gl: "wisselend", rpe: [2, 6], g: "groepsgevoel,mobiliteit,reactie",
    instr: "Tweetallen staan tegenover elkaar. Raise: de leider bepaalt de beweging, de partner spiegelt. Na de potentiate handschoenen aan en naar de zak.",
    roles: "Om de 30 seconden wisselt de leider.", cues: ["Spiegel, niet kopiëren", "Kijk elkaar aan"], easy: "Trainer leidt de raise.", hard: "Spiegelen op hoog tempo.", tags: "warming-up,partner",
  },
  {
    title: "Welkom & Intro", d: "Korte opening: doel van de les, partners zoeken, materiaal klaarzetten.", phase: "opening",
    ex: [["~Doel van de les benoemen"], ["~Partner kiezen (iemand die je nog niet kent)"]],
    st: CT(120, "Welkom", { explain: 0, text: "Doel van vandaag, partners, materiaal" }), org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "groepsgevoel",
    instr: "Welkom, focus van de les in één zin, partners kiezen en handschoenen klaarleggen bij de zak.", cues: ["Kort en energiek", "Noem nieuwe deelnemers bij naam"], tags: "opening",
  },
  {
    title: "Core Classic", d: "Vier minuten core voor de hele groep op de mat.", phase: "core", format: "40/20 Intervals",
    ex: [["Forearm Plank", "40 sec"], ["Dead Bug", "40 sec"], ["Russian Twist", "40 sec"], ["Side Plank", "40 sec"]],
    st: ST(4, [["Werk", "work", 40], ["Wissel", "rest", 15]], { explain: 20 }), org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [5, 7], g: "kracht,spieruithouding",
    instr: "Vier oefeningen à 40 sec met 15 sec wissel. Handschoenen uit.", cues: ["Onderrug in controle", "Ademen"], easy: "Knieën op de vloer bij de plank.", hard: "Hollow rock in plaats van dead bug.", tags: "core",
  },
  {
    title: "Cooling-down & Ademhaling", d: "Afbouwen, rekken en samen ademhalen.", phase: "cooldown",
    ex: [["Easy Shadowboxing", "60 sec"], ["Kneeling Lunge Stretch"], ["Cross-Body Shoulder Stretch"], ["Child’s Pose"], ["Slow Controlled Breathing", "6×"]],
    st: ST(1, [["Afbouwen", "work", 60, "Easy shadowboxing, tempo omlaag"], ["Rekken", "work", 120, "Heupbuigers · schouders · child’s pose"], ["Ademhaling + afsluiting", "work", 60, "4 tellen in, 6 uit · compliment aan je partner"]], { explain: 0 }),
    org: "klassikaal", eq: "lichaamsgewicht", gl: "uit", rpe: [1, 2], g: "herstel,mobiliteit,groepsgevoel",
    instr: "De trainer leidt klassikaal. Sluit af met samen ademhalen en een compliment aan je partner.", cues: ["Lange uitademing", "Ontspan bij elke uitademing"], tags: "cooling-down",
  },
  {
    title: "Bag Basics 1-2-3", d: "Twaalf minuten basistechniek op de zak met vaste partner.", phase: "bag-basics", format: "Technical Ladder",
    ex: [["Single Jab", "ronde 1–2"], ["1-2", "ronde 3–4"], ["1-2-3", "ronde 5–6"], ["1-2-3-10", "ronde 7–8"]],
    st: AB(30, 10, 8, { reset: 10, transition: 20 }), org: "tweetallen", eq: "bokszak", gl: "aan", rpe: [4, 6], g: "techniek,coordinatie",
    instr: "Twee rondes per trede. In de wissel geeft de houder één tip.", roles: "B houdt de zak en geeft in de wissel één tip.", cues: ["Hand terug naar de kin", "Voeten onder je"], easy: "Stop bij 1-2-3.", hard: "Laatste trede 1-2-3-10-10.", tags: "techniek",
  },
];

export const SEED_BLOCKS: TrainingBlock[] = BLOCKS.map((b) => {
  const id = `blk-${slugify(b.title)}`;
  return {
    kind: "block",
    id,
    builtin: true,
    origin: "concept",
    sourceNote: "FightLab basisbibliotheek",
    description: b.d,
    tags: b.tags ? b.tags.split(",") : [],
    ...buildBlockContent(b, id),
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  };
});
