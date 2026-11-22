/**
 * De ingebouwde basisbibliotheek van FightLab.
 * Deze data wordt met de app meegeleverd en nooit in de database overschreven:
 * eigen wijzigingen worden als aparte ‘override’ opgeslagen (zie lib/data/library.ts).
 */
export { SEED_EXERCISES, exerciseSeedIssues } from "./exercises";
export { SEED_FORMATS, formatSeedIssues } from "./formats";
export { SEED_BLOCKS } from "./blocks";
export { SEED_TEMPLATES, EMPTY_TEMPLATE_ID } from "./templates";
export { SEED_LESSONS } from "./lessons";
export { blockSeedIssues } from "./build-block";
export { SEED_VERSION, SEED_DATE } from "./meta";
