# Basisbibliotheek: inhoud en regels

De basisbibliotheek wordt met de app meegeleverd (`src/data/seed/`) en is opgebouwd uit de catalogus in de briefing (`src/data/catalog/`). Tests (`tests/unit/seed-*.test.ts`) controleren dat:

- elke catalogusnaam bestaat (als naam of alias) en in de juiste categorie/sectie valt;
- er minimaal 200 oefeningen, 100 formats, 20 trainingsblokken, 8 lesstructuren en 4 voorbeeldlessen zijn;
- geen twee oefeningen of formats dezelfde omschrijving, uitvoering of spelregel hebben;
- alle verwijzingen (oefeningen in formats/blokken, formats in blokken, bronblokken in lessen) geldig zijn;
- de voorbeeldlessen exact 60:00 duren en geen tijdsverschillen tussen structuur en geplande duur hebben;
- de voorbeeldlessen geen waarschuwingen uit de lescontrole opleveren.

## Nummering (orthodoxe stand; southpaw gespiegeld)

| Nr | Techniek |
| --- | --- |
| 1 | jab |
| 2 | cross |
| 3 | linkerhoek |
| 4 | rechterhoek |
| 9 | linker lowkick |
| 10 | rechter lowkick |
| 11 | linker bodyshot |
| 12 | rechter bodyshot |

Andere technieken worden met hun naam aangeduid (rechter opstoot, linker midkick, teep). Combinaties die herpositionering vragen (bijv. `1-2-4-9`, `1-2-9`, `2-9`) beschrijven in de uitvoering hoe het gewicht terug naar het achterste been gaat.

## Samengevoegde oefeningen (één oefening, meerdere categorieën)

Waar de catalogus dezelfde oefening onder verschillende namen of categorieën noemt, is er één oefening met aliassen en meerdere categorieën:

`1-2` ← Jab-Cross · `1-1-2` ← Double Jab-Cross · `1-2-1` ← Jab-Cross-Jab · `1-2-1-2` ← Jab-Cross-Jab-Cross · `1-2-3` ← Jab-Cross-Hook · `1-2-10` ← Double Punch-Kick, 1-2 + Lowkick · `1-2-3-10` ← Triple Punch-Kick · `1-2 & Step Out` ← 1-2 + Exit · `Jab + Step In` ← Jab & Step · `Double Rear Lowkick` ← Double Lowkick · `Jump Squat` ← Squat Jump · `Air Squat` ← Air Squats · `Reverse Lunge` ← Alternating Reverse Lunges · `Shadowboxing Light` ← Easy Shadowboxing · `Shadowboxing Sprint` ← Speed Shadowboxing · `Single-Leg Balance` ← Single-Leg Balance Hold · `Standing Trunk Rotation` ← Standing Torso Rotation · `Plank Shoulder Tap` ← Shoulder Taps · `Mountain Climbers` ← Mountain Climber · `Cross-Body Mountain Climbers` ← Cross-Body Mountain Climber · `Double Punch Sit-up` ← Boxing Sit-up + Double Punch · `High Plank` ← High Plank Hold · `Forearm Plank` ← Low Plank Hold · `Side Plank` ← Side Plank Hold · `Reverse Plank` ← Reverse Plank Hold · `Slam Ball Overhead Slam` ← Slam Ball Slams.

*Sprint & Cruise*, *Speed Ladder* en *Power on Command* staan in de oefeningencatalogus, maar zijn inhoudelijk werkvormen. Ze staan daarom als **format** in de bibliotheek. Zoeken in de tab Oefeningen verwijst er automatisch naar.

## Samengevoegde formats (geen cosmetische synoniemen)

Formats met inhoudelijk dezelfde spelregel zijn één format met een alias (vindbaar onder beide namen):

Quality Before Quantity ← Quality over Quantity · Perfect Set Relay ← Perfect Relay · Partner’s Choice ← You Choose I Execute · The Perfect Five ← Five Perfect Strikes · Partner Trigger ← Partner Trigger Sprint · Last Punch Power ← Last Power Round · The Finish Line ← No One Left Behind · Countdown Mission ← Squad Countdown · The Rematch ← One Last Improvement · The Final Teammate ← The Final Contributor · Whole Room Target ← Whole Room Mission · en de dubbel genoemde concepten The Improvement Witness, The Silent Coach, The Corner Swap, The Coach Passport en The Corner Conference.

Varianten met een **echt ander** principe blijven apart, bijvoorbeeld EMOM / Technical EMOM / Explosive EMOM / Boxing EMOM / Alternating EMOM / Group EMOM, of AMRAP / Cardio AMRAP / Duo AMRAP / Last Round AMRAP.

## Herkomst

- **Gangbaar trainingsprincipe** (46 formats, alle oefeningen): bekende werkvormen zoals EMOM, Tabata, AMRAP, ladders en piramides, uitgewerkt voor bokszaktraining.
- **FightLab-concept** (222 formats): eigen spelconcepten met een eigen spelregel, partnerrol en voorbeeld.
- **Eigen item**: alles wat je zelf in de app maakt.

## Uitbreiden

Nieuwe ingebouwde items voeg je toe in de juiste sectie onder `src/data/seed/…` in de compacte notatie (zie het commentaar in `exercises/types.ts` en `formats/types.ts`). Draai daarna `npm test`: de seedtests melden ontbrekende velden, onbekende waarden, dubbele namen of kapotte verwijzingen. Eigen aanpassingen van gebruikers worden nooit overschreven (zie `CLAUDE.md`).
