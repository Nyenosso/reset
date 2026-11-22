# FightLab vanaf je iPhone: gebruiken, aanpassen en beheren

Er zijn twee soorten aanpassingen:

| Wat wil je? | Waar? | Code nodig? |
| --- | --- | --- |
| Oefeningen, formats, blokken, lesstructuren en lessen maken of wijzigen | In FightLab zelf | Nee |
| Nieuwe functies, andere layout of andere werking | Claude Code (claude.ai/code of de Claude-app) + GitHub | Nee, je beschrijft het; Claude schrijft de code |

---

## 1. FightLab als app op je beginscherm

1. Open je FightLab-adres (bijv. `https://fightlab.vercel.app`) in **Safari**.
2. Tik op **Deel** (vierkant met pijl omhoog) → **Zet op beginscherm** → **Voeg toe**.
3. FightLab opent voortaan schermvullend, zonder adresbalk.

**Inloggen in de beginscherm-app:** Meer → Account → e-mail invullen → **Stuur inlogcode** → typ de 6-cijferige code uit de mail. (De link in de mail opent Safari, dat een eigen opslag heeft. Daarom gebruik je in de app de code.)

## 2. Dagelijks gebruik

- **Les maken**: Lesmaker → Nieuwe les → kies een lesstructuur (bijv. *Squad Saturday*) → tik op een leeg tijdslot (“Vul in”) en kies een blok, format of oefening.
- **Snel een oefening of format zoeken**: Bibliotheek → typ, bijvoorbeeld `lowkick` of `1-2-3-10`.
- **Inspiratie**: Bibliotheek → ✨ Formatkiezer → kies moment, duur, doel en organisatie → **Voeg toe**.
- **Blok verplaatsen**: houd de sleepgreep (⋮⋮) vast en schuif, of gebruik ⋯ → *Verplaats omhoog / omlaag / naar…*.
- **Vlak voor de les aanpassen**: open de les, tik op een blok, wijzig, en tik **Klaar**. Alles wordt automatisch opgeslagen.
- **Tijdens de les**: tik op ⏱ (Coachmodus) → ▶. Tip: zet *Scherm aan houden* aan bij Meer → Coachmodus.
- **Whiteboard**: ⋯ → *Exporteren / kopiëren* → **Kopieer tekst**, en plak in Notities, Notion of WhatsApp.
- **Na de les**: ⋯ → *Markeer als gegeven* → beoordeling en korte evaluatie.
- **Back-up**: Meer → Gegevens → **Back-up downloaden** (JSON in je Bestanden-app).

## 3. De software aanpassen met Claude Code (vanaf je telefoon)

Je hebt geen terminal of laptop nodig.

**Eenmalig:**
1. Zorg dat de code op GitHub staat (deze repository) en dat Claude toegang heeft: koppel GitHub via [claude.ai/connect-github](https://claude.ai/connect-github) en installeer de Claude GitHub App op de repository.
2. Koppel de repository aan Netlify (of Vercel; zie README → *Publiceren*). Elke wijziging op `master` wordt dan automatisch gepubliceerd; elke pull request krijgt een previewlink.

**Elke keer dat je iets wilt veranderen:**
1. Open de Claude-app of [claude.ai/code](https://claude.ai/code) en start een sessie op deze repository.
2. Beschrijf wat je wilt, bijvoorbeeld:
   - *“Voeg in de coachmodus een knop toe om 10 seconden extra tijd te geven.”*
   - *“Maak de bibliotheekkaarten iets compacter en toon de RPE niet meer.”*
   - *“Voeg een format ‘Ladder Battle’ toe aan de basisbibliotheek met deze regel: …”*
3. Claude leest `CLAUDE.md` (projectregels), maakt de wijziging op een aparte branch, draait de tests en pusht.
4. Vraag Claude om een **pull request**. Open de **previewlink** van Vercel/Netlify op je iPhone en probeer het uit.
5. Tevreden? Merge de pull request (in de GitHub-app of via Claude). Binnen een minuut staat de nieuwe versie online. Sluit FightLab op je iPhone en open het opnieuw om de update te laden.

**Handig om te weten**
- Je eigen lessen en aanpassingen staan in Supabase (of lokaal), niet in de code. Een software-update raakt ze niet.
- Wil je iets terugdraaien? Vraag Claude om de betreffende pull request te reverten.
- Vraag Claude bij grotere wijzigingen eerst om een plan; dan kun je bijsturen voordat er code wordt geschreven.

## 4. Beheer

| Taak | Waar |
| --- | --- |
| Gegevens bekijken of exporteren | Supabase → Table Editor, of FightLab → Meer → Back-up |
| Inlogmails / codes | Supabase → Authentication |
| Publicaties en previews | Vercel/Netlify-dashboard |
| Code en geschiedenis | GitHub (app of website) |
| Materiaal en aantallen (zakken, pads …) | FightLab → Meer → Beschikbaar materiaal |
