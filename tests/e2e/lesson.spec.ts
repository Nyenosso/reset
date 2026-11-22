import { expect, test } from "@playwright/test";
import { blockTitles, fresh, openLessonFromTemplate } from "./helpers";

test.describe("Lesmaker", () => {
  test.beforeEach(async ({ page }) => fresh(page, "/lesmaker/"));

  test("scenario C: nieuwe les vanuit Squad Saturday toont de 60-minutenstructuur", async ({ page }) => {
    await openLessonFromTemplate(page, "Squad Saturday");
    await expect(page.getByTestId("lesson-block")).toHaveCount(8);
    await expect(page.getByTestId("time-planned")).toHaveText("60:00");
    await expect(page.getByTestId("time-remaining")).toHaveText("Precies op tijd");
  });

  test("tijdslot invullen met een trainingsblok en duur aanpassen", async ({ page }) => {
    await openLessonFromTemplate(page, "Squad Saturday");
    // Slot 4 (Skills & Reaction, 8 min) vullen met The Three Commands (6 min).
    await page.getByRole("button", { name: /Blok 4: Skills & Reaction invullen/ }).click();
    await page.getByRole("dialog").getByLabel("Zoek blok, format of oefening").fill("Three Commands");
    await page.getByTestId("picker-item").first().click();
    await expect(page.getByTestId("time-planned")).toHaveText("58:00");
    // +1 min via het menu.
    await page.getByTestId("block-menu").nth(3).click();
    await page.getByRole("menuitem", { name: "+1 min" }).click();
    await expect(page.getByTestId("time-planned")).toHaveText("59:00");
  });

  test("blokken verplaatsen met menu en met slepen (scenario D)", async ({ page }) => {
    await openLessonFromTemplate(page, "Squad Saturday");
    const before = await blockTitles(page);
    await page.getByTestId("block-menu").nth(0).click();
    await page.getByRole("menuitem", { name: "Verplaats omlaag" }).click();
    const afterMenu = await blockTitles(page);
    expect(afterMenu[0]).toBe(before[1]);
    expect(afterMenu[1]).toBe(before[0]);

    // Slepen: blok 5 naar positie 7.
    const handle = page.getByTestId("drag-handle").nth(4);
    const target = page.getByTestId("lesson-block").nth(6);
    await handle.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const hb = (await handle.boundingBox())!;
    const tb = (await target.boundingBox())!;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2 + 10, { steps: 4 });
    await page.mouse.move(hb.x + hb.width / 2, tb.y + tb.height * 0.6, { steps: 12 });
    await page.mouse.up();
    const afterDrag = await blockTitles(page);
    expect(afterDrag[6]).toBe(afterMenu[4]);
    await expect(page.getByTestId("time-planned")).toHaveText("60:00");
  });

  test("oefening uit de bibliotheek in een bestaand blok plaatsen", async ({ page }) => {
    await openLessonFromTemplate(page, "Klassieke opbouw");
    await page.goto("/bibliotheek/");
    await page.getByLabel("Zoeken in de bibliotheek").fill("Rear Lowkick");
    await page.getByRole("button", { name: "Rear Lowkick toevoegen aan les", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^02 — Bag Basics/ }).click();
    await page.goto("/lesmaker/");
    await expect(page.getByTestId("lesson-block").nth(1)).toContainText("Rear Lowkick");
  });

  test("format toevoegen en intervallen tellen mee in de lestijd", async ({ page }) => {
    await page.getByTestId("new-lesson").click();
    await page.getByTestId("new-empty-lesson").click();
    await page.getByTestId("add-block").filter({ visible: true }).click();
    await page.getByRole("dialog").getByRole("tab", { name: "Formats" }).click();
    await page.getByRole("dialog").getByLabel("Zoek blok, format of oefening").fill("Captain");
    await page.getByTestId("picker-item").first().click();
    // Blokeditor opent: 1 min uitleg + 5 × 60 sec = 6:00.
    await expect(page.getByLabel("Duur van het blok (mm:ss)")).toHaveValue("6:00");
    await page.getByRole("button", { name: "Rondes verhogen", exact: true }).click();
    await expect(page.getByLabel("Duur van het blok (mm:ss)")).toHaveValue("7:00");
    await page.getByTestId("block-done").click();
    await expect(page.getByTestId("time-planned")).toHaveText("7:00");
  });

  test("autosave: wijzigingen blijven na herladen bewaard", async ({ page }) => {
    await openLessonFromTemplate(page, "Power House");
    await page.getByTestId("lesson-title").fill("Mijn powerles");
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByTestId("lesson-title")).toHaveValue("Mijn powerles");
    await expect(page.getByTestId("lesson-block")).toHaveCount(8);
  });

  test("lescontrole toont aandachtspunten", async ({ page }) => {
    await openLessonFromTemplate(page, "Squad Saturday");
    await page.getByTestId("checks-toggle").click();
    await expect(page.getByTestId("checks-list")).toContainText("tijdsloten zijn nog niet ingevuld");
  });
});

test.describe("Lessen, export en coach", () => {
  test.beforeEach(async ({ page }) => fresh(page, "/lessen/"));

  test("voorbeeldlessen staan klaar en zijn precies 60 minuten", async ({ page }) => {
    await expect(page.getByTestId("lesson-card")).toHaveCount(4);
    await page.getByRole("button", { name: /Fight Night/ }).first().click();
    await expect(page.getByTestId("time-planned")).toHaveText("60:00");
  });

  test("scenario E: les dupliceren en één blok vervangen; origineel blijft", async ({ page }) => {
    await page.getByTestId("lesson-card").filter({ hasText: "Power & Conditioning" }).getByTestId("lesson-card-menu").click();
    await page.getByRole("menuitem", { name: "Dupliceren" }).click();
    await expect(page.getByTestId("lesson-title")).toHaveValue("Power & Conditioning (kopie)");
    await page.getByTestId("block-menu").nth(6).click();
    await page.getByRole("menuitem", { name: "Verwijderen" }).click();
    await expect(page.getByTestId("lesson-block")).toHaveCount(7);
    await page.getByTestId("add-block").filter({ visible: true }).click();
    await page.getByRole("dialog").getByLabel("Zoek blok, format of oefening").fill("Shared Mission");
    await page.getByTestId("picker-item").first().click();
    await expect(page.getByTestId("lesson-block")).toHaveCount(8);
    await page.goto("/lessen/");
    await page.getByTestId("lesson-card").filter({ has: page.getByText("Power & Conditioning", { exact: true }) }).getByRole("button").first().click();
    await expect(page.getByTestId("lesson-title")).toHaveValue("Power & Conditioning");
    await expect(page.getByTestId("lesson-block")).toHaveCount(8);
    await expect(page.getByTestId("lesson-block").nth(6)).toContainText("Teamchallenge");
  });

  test("export als tekst bevat inhoud en juiste tijden; printweergave werkt", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: /Squad Saturday/ }).first().click();
    await page.getByTestId("lesson-menu").click();
    await page.getByRole("menuitem", { name: "Exporteren / kopiëren" }).click();
    const preview = page.getByTestId("export-preview");
    await expect(preview).toContainText("BOKSZAKTRAINING — SQUAD SATURDAY");
    await expect(preview).toContainText("Captain’s Call");
    await expect(preview).toContainText("TOTAAL: 60’");
    await page.getByTestId("copy-text").click();
    await expect(page.getByText("Tekst gekopieerd")).toBeVisible();
    await page.getByRole("link", { name: "Print / PDF" }).click();
    await expect(page.getByTestId("print-title")).toContainText("Squad Saturday");
    await expect(page.getByTestId("print-button")).toBeVisible();
  });

  test("markeer als gegeven met evaluatie", async ({ page }) => {
    await page.getByTestId("lesson-card").filter({ hasText: "Back to Basics" }).getByTestId("lesson-card-menu").click();
    await page.getByRole("menuitem", { name: "Markeer als gegeven" }).click();
    await page.getByRole("radio", { name: "4" }).click();
    await page.getByLabel("Wat werkte goed?").fill("De streak-challenge");
    await page.getByTestId("save-given").click();
    await page.getByRole("tab", { name: /Gegeven/ }).click();
    await expect(page.getByTestId("lesson-card")).toHaveCount(1);
    await expect(page.getByTestId("lesson-card")).toContainText("4/5");
  });

  test("scenario F: coachmodus toont blok, opdracht en lopende timer", async ({ page }) => {
    await page.getByTestId("lesson-card").filter({ hasText: "Squad Saturday" }).getByTestId("lesson-card-menu").click();
    await page.getByRole("menuitem", { name: "Coachmodus" }).click();
    await expect(page.getByTestId("coach-block")).toContainText("Blok 1 — Sociale opening");
    await expect(page.getByTestId("coach-clock")).toHaveText("2:00");
    await page.getByTestId("coach-toggle").click();
    await page.waitForTimeout(2300);
    await expect(page.getByTestId("coach-clock")).not.toHaveText("2:00");
    await page.getByRole("button", { name: "Volgend interval" }).click();
    await expect(page.getByTestId("coach-block")).toContainText("Blok 2");
    await page.getByRole("tab", { name: "Leesmodus" }).click();
    await expect(page.getByText("Shared Mission").first()).toBeVisible();
  });
});

test("scenario B: formatkiezer geeft passende formats en voegt toe", async ({ page }) => {
  await fresh(page, "/formatkiezer/");
  await page.getByTestId("picker-phase").selectOption("cardio");
  await page.getByTestId("picker-duration").selectOption("5-8");
  await page.getByRole("button", { name: "Tweetallen", exact: true }).click();
  await page.getByRole("button", { name: /^Hoog/ }).click();
  const first = page.getByTestId("rec-card").first();
  await expect(first).toContainText("Past bij Cardio & Endurance");
  await expect(first).toContainText("Tweetallen");
  await first.getByTestId("rec-add").click();
  await expect(page).toHaveURL(/\/lesmaker\/\?blok=/);
  await expect(page.getByLabel("Titel van het blok")).toBeVisible();
});
