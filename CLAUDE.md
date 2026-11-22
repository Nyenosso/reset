# CLAUDE.md: werkafspraken voor FightLab

Lees dit voordat je iets wijzigt. Het vervangt de oorspronkelijke briefing.

## Productvisie

FightLab is de persoonlijke werkruimte van één bokszaktrainer (groepslessen van 60 min bij Indoor Action, meestal ~20 en maximaal 32 deelnemers, gemengd niveau, vaak in tweetallen). De app combineert:

1. **Bibliotheek**: oefeningen, formats, trainingsblokken en lesstructuren; snel zoeken, filteren en favorieten.
2. **Formatkiezer**: regelgebaseerde, transparante aanbevelingen (geen AI-API).
3. **Lesmaker**: blokken toevoegen, vullen, slepen, dupliceren; correcte tijdsberekening en adviserende lescontrole.
4. **Mijn lessen + coachmodus**: archief, dupliceren, ‘gegeven’ met evaluatie, export, timer tijdens de les.

Het gevoel: de snelheid van een notitie-app, de rust van een goede takenplanner. Geen sociale functies, AI-chatbots, abonnementen, badges, dashboards of decoratie.

## Ontwerpprincipes (niet onderhandelbaar)

- **Mobile-first** (iPhone 375–430 px), duimbereik, raakvlakken ≥ 44 px, bottom navigation; desktop krijgt een zijbalk en bredere lesmaker.
- **Minimalistisch**: warme lichte achtergrond, bijna zwarte tekst, één accentkleur (`--color-accent`, oranjerood), subtiele randen, nauwelijks schaduw, geen gradients/glas/stockfoto’s/decoratieve badges.
- **Snelheid boven complexiteit**: zo min mogelijk handelingen, direct zoeken, weinig typen, geen onnodige bevestigingen.
- **Autosave** overal in de lesmaker; **undo** via toast bij verwijderen/toevoegen; definitief verwijderen alleen na bevestiging (prullenbak voor lessen).
- **Geen hover-only acties**; drag-and-drop heeft altijd een alternatief (menu: omhoog/omlaag/verplaats naar…), ook voor toetsenbord.
- Formulieren compact: verplichte velden eerst, de rest onder ‘Meer details’. Bottom sheets i.p.v. schermvullende modals; de blokeditor is een eigen pagina (`/lesmaker/?blok=id`).
- Toegankelijk: semantische HTML, labels, zichtbare focus, contrast AA, betekenis nooit alleen via kleur.

## Nederlandse UI-conventies

- Alle UI-tekst, meldingen en foutmeldingen in helder Nederlands, kort en vriendelijk. Oefening- en formatnamen blijven Engels zoals in de catalogus.
- Tijden: intern **hele seconden**; weergave via `src/lib/time/format.ts` (`formatClock` 54:30, `formatDuration` 6:30 min, `formatWhiteboard` 8’ / 6’30”).
- Nummering (orthodox): 1 jab · 2 cross · 3 linkerhoek · 4 rechterhoek · 9 linker lowkick · 10 rechter lowkick · 11 linker bodyshot · 12 rechter bodyshot. Altijd consequent gebruiken. Andere technieken bij naam (rechter opstoot, linker midkick, teep).
- Termen: les, blok, format, oefening, lesstructuur, tijdslot, uitleg, wissel, reset, overgang, houder, RPE.

## Trainingsspecifieke randvoorwaarden

- Materiaal: bokszakken, bokshandschoenen, pads, trapkussens, slam balls, gewichtjes 1–2 kg, flexibeams, lichaamsgewicht. Ga **niet** uit van kettlebells, barbells, halters, medicineballen of cardiomachines.
- Elke les moet werken met 20–32 deelnemers (stations, zakken per tweetal, wisseltijd).
- Korte intervallen (20–45 s), eenvoudige instructies, weinig partner-/materiaal-/handschoenwissels, techniek vóór zware vermoeidheid, herstel bij explosief werk, differentiatie binnen dezelfde opdracht, regelmatig samenwerken.
- Een format is een **spelregel/werkstructuur**, een oefening is **wat** men uitvoert. Niet door elkaar halen. Geen cosmetische synoniemen als aparte formats.
- Vloeroefeningen (push-ups, planks op de handen, gewichtjes) = handschoenen uit.

## Projectstructuur (kort)

```
src/app/                 routes; elke page.tsx rendert een client-view in <Suspense>
src/components/…         ui (basis), layout, library, picker, lesson, lessons, coach, settings, shared
src/data/catalog/        catalogusnamen uit de briefing (indeling + tests)
src/data/seed/           ingebouwde bibliotheek (compacte notatie + builders + validatie)
src/lib/domain/          types.ts (datamodel) en vocab.ts (vaste id’s + labels)
src/lib/time/            tijdsberekening (structure.ts), presets, format
src/lib/data/            library-merge, search, recommend, checks, lesson-ops, export, validation, defaults
src/lib/store/           zustand-store (index.ts), persistence (localStorage + outbox), ui-store
src/lib/sync/            mapper (rij ↔ object), merge, remote (Supabase), engine (debounce/retry/auth)
src/lib/coach/           tijdlijn, timer-hook (absolute tijd), signalen (geluid/scherm aan)
supabase/                migraties (schema + RLS) en RLS-test
tests/unit, tests/e2e    Vitest en Playwright
```

## Belangrijke datamodellen (`src/lib/domain/types.ts`)

- `Exercise`, `Format`, `TrainingBlock`, `LessonTemplate`: bibliotheekitems met `LibraryMeta` (`id`, `builtin`, `origin`: gangbaar | concept | eigen, `createdAt/updatedAt`).
- `BlockContent`: gedeelde inhoud van een blok (titel, fase, format, oefeningen, `structure`, `durationMode` auto|manual, `durationSec`, organisatie, materiaal, handschoenen, RPE, doelen, instructie, partnerrollen, cues, varianten, notities).
- `BlockStructure`: `explainSec`, `setupSec`, `rounds`, `intervals[]` (label, kind work|switch|rest|reset, seconds, text), `restBetweenRoundsSec`, `transitionSec`. Duur = uitleg + opstellen + rondes × ronde + (rondes − 1) × rust + overgang.
- `LessonBlock` = `BlockContent` + `id` + optioneel `sourceBlockId` (snapshot van een bibliotheekblok) + `placeholder` (leeg tijdslot uit een lesstructuur).
- `Lesson`: titel, datum, doelgroep, deelnemers, `targetSec`, status concept|gepland|gegeven, favoriet, `blocks[]`, `evaluation`, `deletedAt` (prullenbak).
- `UserData`: alles van de gebruiker (eigen/aangepaste items per type, lessen, `hidden`, `favorites`, `recent`, `prefs`).

## Regels voor data (geen dataverlies!)

1. **Seed is read-only.** De basisbibliotheek komt uit de code. Een wijziging aan een ingebouwd item wordt opgeslagen als **override** met dezelfde id in `UserData`; `mergeLibrary` legt overrides over de seed. Verbergen = id in `hidden`. Pas nooit opgeslagen gebruikersdata aan om een seedwijziging door te voeren.
2. **Seed-id’s nooit hernoemen of hergebruiken** (`ex-…`, `fmt-…`, `blk-…`, `tpl-…`, `les-…`; afgeleid van de naam via `slugify`). Een naamswijziging van een seeditem verandert de id: voeg dan liever een alias toe of houd de oude naam en wijzig alleen tekst.
3. **Lesblokken zijn snapshots.** Een bibliotheekblok wijzigen verandert bestaande lessen niet (`sourceBlockId` is alleen een verwijzing).
4. **Alle mutaties via de store** (`useStore`): die zet `updatedAt`, schrijft naar localStorage (debounce 250 ms + bij `pagehide`) en zet een entry in de **outbox** voor Supabase. Muteer nooit `data` rechtstreeks.
5. **Schemawijzigingen**: nieuwe migratie in `supabase/migrations/` (nooit een bestaande aanpassen die al gedraaid is), mapping in `src/lib/sync/mapper.ts`, validatie in `src/lib/data/validation.ts`, en `normalizeUserData` voor oude lokale data. Verhoog `SCHEMA_VERSION` als het exportformaat verandert.
6. RLS: elke nieuwe tabel krijgt `user_id` + de vier policies (zie migratie). Nooit de service_role key in de app.

## Regels voor nieuwe features

- Eerst de pure logica in `src/lib/…` met unit tests; daarna de UI.
- Hergebruik `components/ui` (Button, Sheet, Menu, Chip/ChipGroup, Segmented, Stepper, Field/Input) en `PageHeader`/`PageBody`.
- Tijd altijd via `src/lib/time/structure.ts` berekenen; nooit losse optellingen in componenten.
- Aanbevelingen en lescontrole blijven **transparant** (redenen/waarschuwingen in tekst) en **adviserend**.
- Houd bestanden klein en per onderwerp; client components beginnen met `"use client"`.
- De app is een **statische export** (`output: "export"`): geen server actions, API-routes, cookies of dynamische routesegmenten; gebruik query-parameters (`?les=`, `?blok=`, `?item=`).
- Geen zware nieuwe dependencies zonder noodzaak.

## Commando’s

```bash
npm run dev          # ontwikkelen (http://localhost:3000)
npm run typecheck    # tsc
npm run lint         # eslint (React Compiler-regels aan: geen setState in effects, geen refs tijdens render)
npm test             # vitest (unit + seed-integriteit)
npm run build        # statische export naar out/
npm run test:e2e     # playwright (bouw eerst; serveert out/ via scripts/serve-static.mjs)
npm run test:rls     # schema + RLS tegen tijdelijke lokale PostgreSQL
npm run check        # alles behalve e2e
```

Lever wijzigingen pas op als `npm run check` slaagt; draai e2e bij UI-wijzigingen.

## Omgevingsvariabelen

`NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publiek, RLS beschermt). Zonder deze waarden: demo-modus (alleen localStorage), duidelijk aangegeven in de UI.
