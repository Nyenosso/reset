# FightLab

Persoonlijke trainingsbibliotheek en visuele lesplanner voor bokszaktrainingen (groepslessen van 60 minuten, 20–32 deelnemers, gemengd niveau).

FightLab combineert vier dingen:

1. **Bibliotheek**: 415 oefeningen, 268 trainingsformats, 26 trainingsblokken en 11 lesstructuren. Snel doorzoekbaar en te filteren, met favorieten.
2. **Formatkiezer**: kies lesfase, doel, duur, intensiteit, organisatie en materiaal; je krijgt direct passende formats met uitleg waarom ze passen.
3. **Lesmaker**: een les opbouwen met blokken, drag-and-drop (met sleepgreep, ook op iPhone), automatische tijdsberekening en lescontrole.
4. **Mijn lessen + coachmodus**: archief, dupliceren, markeren als gegeven, whiteboard-export, printen/PDF en een grote timer voor tijdens de les.

> Zonder configuratie draait FightLab in **demo-modus**: alles wordt alleen in je browser bewaard. Koppel Supabase om je gegevens in de cloud te bewaren en op al je apparaten te gebruiken.

---

## Snel starten (lokaal)

Vereist: Node.js 20.9 of nieuwer.

```bash
npm install
npm run dev          # ontwikkelserver op http://localhost:3000
```

Productieversie lokaal bekijken:

```bash
npm run build        # statische export naar out/
npm start            # serveert out/ op http://127.0.0.1:4173
```

## Wat zit erin

| Onderdeel | Aantal | Bron |
| --- | --- | --- |
| Oefeningen | 415 uniek (alle namen uit de catalogus, dubbelingen samengevoegd met meerdere categorieën) | `src/data/seed/exercises/` |
| Formats | 268 (46 gangbare principes, 222 FightLab-concepten), 10 secties | `src/data/seed/formats/` |
| Trainingsblokken | 26 (de 20 uit de briefing + 6 bouwstenen voor complete lessen) | `src/data/seed/blocks.ts` |
| Lesstructuren | 11 (8 uit de briefing, klassieke opbouw, Next Round met 10 onderdelen, lege les) | `src/data/seed/templates.ts` |
| Voorbeeldlessen | 4, elk exact 60:00 incl. uitleg, wissels, herstel en handschoenwissels | `src/data/seed/lessons.ts` |

Zie [`docs/bibliotheek.md`](docs/bibliotheek.md) voor de inhoudelijke regels en welke catalogusnamen zijn samengevoegd.

## Belangrijkste functies

- **Zoeken** op naam, alias, nummering (`1-2-3-10`), categorie, doel, spiergroep en omschrijving. Geen treffers in deze tab? Dan zie je waar het wél staat.
- **Filters** per tab, **favorieten** met één tik, **recent gebruikt**.
- **Bewerken zonder code**: oefeningen, formats, blokken en lesstructuren aanmaken, aanpassen, dupliceren ("nieuw format op basis van …"), verbergen en herstellen. Aanpassingen aan ingebouwde items worden apart bewaard en overleven updates van de basisbibliotheek.
- **Lesmaker**: lege les, vanuit een lesstructuur (met tijdsloten die je invult), of een bestaande les dupliceren. Blokken toevoegen, invullen, dupliceren, verplaatsen (slepen, ‘omhoog/omlaag’, ‘verplaats naar…’), ±30 sec / +1 min, opslaan in de bibliotheek.
- **Tijdsberekening** in hele seconden: uitleg, opstellen/handschoenen, rondes × intervallen, rust tussen rondes en overgang tellen mee. ‘Gepland / doel / resterend of overschrijding’ staat altijd bovenaan.
- **Lescontrole** (adviserend): tijd, zakken en materiaal per groepsgrootte, materiaal- en handschoenwissels, schouder- en beenbelasting, power na vermoeidheid, herstel bij explosief werk, partnerinteractie, rol van de houder, gezamenlijk groepsmoment, vloeroefeningen met handschoenen.
- **Coachmodus**: groot aftellen, huidig blok en interval, ronde x van y, volgende stap, coaching cues, start/pauze/vorige/volgende/reset, piep bij wissels, scherm aan houden (waar de browser dat ondersteunt), plus een leesmodus.
- **Export**: kopiëren als whiteboardtekst of Markdown, printvriendelijke weergave (opslaan als PDF via afdrukken), JSON-back-up per les en volledige back-up/herstel in Instellingen.
- **PWA**: installeerbaar op je beginscherm; de app opent ook zonder verbinding.

## Opslag en synchronisatie

| Situatie | Waar staan je gegevens? |
| --- | --- |
| Demo-modus (geen Supabase) | Alleen in deze browser (`localStorage`). Maak back-ups via Meer → Gegevens. |
| Supabase ingesteld, niet ingelogd | Lokaal; wijzigingen wachten in een wachtrij tot je inlogt. |
| Ingelogd | Supabase is de bron van waarheid; lokaal is een snelle cache. Wijzigingen worden automatisch (gedebounced) opgeslagen. |

De status zie je rechtsboven (iPhone) of linksonder (desktop): *Demo · alleen op dit apparaat*, *Opslaan…*, *Opgeslagen*, *Offline* of *Niet gesynchroniseerd*.

## Supabase koppelen (eenmalig, ±10 minuten)

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Open **SQL Editor**, plak de inhoud van [`supabase/migrations/20261122000000_fightlab_schema.sql`](supabase/migrations/20261122000000_fightlab_schema.sql) en klik **Run**. Dit maakt de tabellen, indexen en Row Level Security aan (je ziet en wijzigt alleen je eigen gegevens).
3. **Authentication → Providers → Email**: laat ‘Email’ aan staan.
4. **Authentication → Email Templates → Magic Link**: zet de code in de mail, zodat inloggen ook vanuit de beginscherm-app werkt (die deelt geen cookies met Safari). Voeg bijvoorbeeld toe:
   ```html
   <p>Je FightLab-inlogcode: <strong>{{ .Token }}</strong></p>
   <p>Of klik: <a href="{{ .ConfirmationURL }}">inloggen</a></p>
   ```
5. **Authentication → URL Configuration**: zet *Site URL* op je publicatieadres (bijv. `https://fightlab.vercel.app`) en voeg `https://jouw-adres/meer/` toe aan *Redirect URLs*. Lokaal ook `http://localhost:3000/meer/`.
6. **Project Settings → API**: kopieer de *Project URL* en de *anon/publishable key*.
7. Zet deze als omgevingsvariabelen (lokaal in `.env.local`, online bij je hostingprovider):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   Gebruik **nooit** de `service_role` key: die hoort niet in een browserapp.
8. Bouw/publiceer opnieuw, open **Meer → Account**, vul je e-mail in en log in met de code. Bij de eerste keer inloggen worden je demo-gegevens naar je account geüpload.

## Publiceren

FightLab is een statische export (`out/`) en draait op elke statische host.

**Vercel** (voorkeur): importeer de GitHub-repository op [vercel.com/new](https://vercel.com/new); het framework wordt herkend. Voeg de twee `NEXT_PUBLIC_…`-variabelen toe en klik Deploy. Elke push naar `main` publiceert automatisch; elke pull request krijgt een previewlink.

**Netlify**: ‘Add new site → Import from Git’; `netlify.toml` regelt build (`npm run build`) en map (`out`). Voeg dezelfde variabelen toe.

## Op je iPhone

1. Open je FightLab-adres in **Safari**.
2. Tik op het deelicoon → **Zet op beginscherm** → **Voeg toe**.
3. Open FightLab voortaan vanaf je beginscherm (volledig scherm, zonder adresbalk).

Uitgebreide uitleg, ook over verder ontwikkelen met Claude Code vanaf je telefoon: [`docs/iphone.md`](docs/iphone.md).

## Commando’s

```bash
npm run dev         # ontwikkelen
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # unit tests (Vitest): tijd, aanbevelingen, lescontrole, export, validatie, store, sync, seed-integriteit
npm run build       # productiebuild (statische export)
npm run test:e2e    # end-to-end (Playwright) tegen de build, iPhone- en desktopviewport
npm run test:rls    # databaseschema + Row Level Security tegen een tijdelijke lokale PostgreSQL
npm run check       # typecheck + lint + test + build
```

## Projectstructuur

```
src/
  app/                 routes (bibliotheek, formatkiezer, lesmaker, lessen, meer, coach, print) + manifest
  components/
    ui/                basiscomponenten (shadcn-stijl op Radix): button, sheet, menu, chip, stepper …
    layout/            app-shell, navigatie (bottom nav / zijbalk), paginakop, syncstatus
    library/           bibliotheek: lijst, kaarten, details, editors, filters, toevoegen
    picker/            formatkiezer
    lesson/            lesmaker: board (drag-and-drop), blokeditor, structuureditor, export, print
    lessons/           lesarchief en ‘markeer als gegeven’
    coach/             coachmodus
    settings/          instellingen, account, back-ups
    shared/            formulierhulpen, sorteerbare lijst, oefeningkiezer
  data/
    catalog/           de catalogusnamen uit de briefing (gebruikt voor indeling + tests)
    seed/              de basisbibliotheek (oefeningen, formats, blokken, structuren, voorbeeldlessen)
  lib/
    domain/            types en vocabulaires (lesfasen, doelen, materiaal …)
    time/              tijdsberekening, presets, notatie
    data/              bibliotheek-merge, zoeken, aanbevelingen, lescontrole, lesoperaties, export, validatie
    store/             zustand-store, lokale opslag, UI-state
    sync/              Supabase-mapping, samenvoegen, sync-engine
    coach/             tijdlijn, timer, geluid/scherm-aan
supabase/              migratie (schema + RLS) en RLS-test
tests/unit/            Vitest
tests/e2e/             Playwright
```

## Bekende beperkingen (eerlijk)

- **iPhone en de timer**: iOS pauzeert webpagina’s op de achtergrond en bij vergrendeling. De timer rekent met absolute tijd, dus na terugkeer klopt de stand, maar geluidssignalen op de achtergrond zijn niet mogelijk. ‘Scherm aan houden’ werkt in Safari vanaf iOS 16.4; anders zet je automatische vergrendeling tijdelijk uit.
- **Trillen** wordt door Safari op iPhone niet ondersteund (wel op Android).
- **Demo-modus** bewaart per browser: Safari en de beginscherm-app hebben op iOS elk hun eigen opslag. Koppel Supabase voor één gedeelde bron.
- **Offline**: de app-schil en eerder geopende pagina’s werken offline; wijzigingen worden lokaal bewaard en gesynchroniseerd zodra er weer verbinding is. Er is geen ingewikkelde conflictresolutie: bij gelijktijdig bewerken op twee apparaten wint de laatst opgeslagen versie per les/item.
- Supabase-synchronisatie is getest met een nagebootste client (unit tests) en het schema/RLS tegen een echte PostgreSQL; een test tegen een live Supabase-project gebeurt pas zodra jij een project koppelt.
