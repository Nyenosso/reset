import { expect, test } from "@playwright/test";
import { fresh } from "./helpers";

test.describe("Bibliotheek", () => {
  test.beforeEach(async ({ page }) => fresh(page));

  test("is vanaf het begin gevuld", async ({ page }) => {
    const count = async () => Number((await page.getByTestId("result-count").innerText()).split(" ")[0]);
    expect(await count()).toBeGreaterThanOrEqual(200);
    await page.getByRole("tab", { name: "Formats" }).click();
    expect(await count()).toBeGreaterThanOrEqual(100);
    await page.getByRole("tab", { name: "Blokken" }).click();
    expect(await count()).toBeGreaterThanOrEqual(20);
    await page.getByRole("tab", { name: "Structuren" }).click();
    expect(await count()).toBeGreaterThanOrEqual(8);
  });

  test("scenario A: zoeken op ‘lowkick’ geeft direct relevante oefeningen", async ({ page }) => {
    const t0 = Date.now();
    await page.getByLabel("Zoeken in de bibliotheek").fill("lowkick");
    await expect(page.getByRole("button", { name: "Rear Lowkick bekijken", exact: true })).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(3000);
    await expect(page.getByRole("button", { name: "Front Lowkick bekijken", exact: true })).toBeVisible();
    // Nummering werkt ook: 1-2-3 vindt de combinatie.
    await page.getByLabel("Zoeken in de bibliotheek").fill("1-2-3-10");
    await expect(page.getByRole("button", { name: "1-2-3-10 bekijken", exact: true })).toBeVisible();
  });

  test("filters combineren en verkleinen de lijst", async ({ page }) => {
    const count = async () => Number((await page.getByTestId("result-count").innerText()).split(" ")[0]);
    const all = await count();
    await page.getByRole("button", { name: "Filters" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Trappen", exact: true }).click();
    await page.getByRole("button", { name: "Toon resultaten" }).click();
    const kicks = await count();
    expect(kicks).toBeLessThan(all);
    expect(kicks).toBeGreaterThan(10);
    await page.getByRole("button", { name: "Filters" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Gevorderd", exact: true }).click();
    await page.getByRole("button", { name: "Toon resultaten" }).click();
    const hard = await count();
    expect(hard).toBeLessThan(kicks);
    expect(hard).toBeGreaterThan(0);
  });

  test("favorieten worden bewaard", async ({ page }) => {
    await page.getByLabel("Zoeken in de bibliotheek").fill("Single Jab");
    await page.getByRole("button", { name: "Single Jab als favoriet" }).click();
    await page.getByLabel("Zoeken in de bibliotheek").fill("");
    await page.getByRole("button", { name: "Alleen favorieten" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("1 resultaat");
    await page.reload();
    await page.getByRole("button", { name: "Alleen favorieten" }).click();
    await expect(page.getByRole("button", { name: "Single Jab bekijken" })).toBeVisible();
  });

  test("eigen oefening aanmaken en ingebouwde oefening aanpassen", async ({ page }) => {
    await page.getByTestId("new-item").click();
    await page.getByLabel("Naam *").fill("Mijn testoefening");
    await page.getByLabel("Korte omschrijving *").fill("Een eigen oefening voor de test.");
    await page.getByTestId("editor-save").click();
    await page.getByLabel("Zoeken in de bibliotheek").fill("Mijn testoefening");
    await expect(page.getByRole("button", { name: "Mijn testoefening bekijken" })).toBeVisible();

    await page.getByLabel("Zoeken in de bibliotheek").fill("Single Cross");
    await page.getByRole("button", { name: "Single Cross bekijken" }).click();
    await page.getByRole("button", { name: "Meer acties" }).click();
    await page.getByRole("menuitem", { name: "Bewerken" }).click();
    await page.getByLabel("Korte omschrijving *").fill("Aangepaste omschrijving van de cross.");
    await page.getByTestId("editor-save").click();
    await page.reload();
    await page.getByLabel("Zoeken in de bibliotheek").fill("Single Cross");
    await expect(page.getByText("aangepast").first()).toBeVisible();
    await page.getByRole("button", { name: "Single Cross bekijken" }).click();
    await expect(page.getByText("Aangepaste omschrijving van de cross.")).toBeVisible();
  });

  test("eigen format en trainingsblok aanmaken", async ({ page }) => {
    await page.getByRole("tab", { name: "Formats" }).click();
    await page.getByTestId("new-item").click();
    await page.getByLabel("Naam *").fill("Test Format X");
    await page.getByLabel("Korte omschrijving *").fill("Testformat.");
    await page.getByLabel("Centrale spelregel *").fill("A slaat tot B ‘stop’ roept.");
    await page.getByTestId("editor-save").click();
    await page.getByLabel("Zoeken in de bibliotheek").fill("Test Format X");
    await expect(page.getByRole("button", { name: "Test Format X bekijken" })).toBeVisible();

    await page.getByRole("tab", { name: "Blokken" }).click();
    await page.getByTestId("new-item").click();
    await page.getByLabel("Titel van het blok").fill("Testblok Y");
    await page.getByTestId("editor-save").click();
    await page.getByLabel("Zoeken in de bibliotheek").fill("Testblok Y");
    await expect(page.getByRole("button", { name: "Testblok Y bekijken" })).toBeVisible();
  });
});
