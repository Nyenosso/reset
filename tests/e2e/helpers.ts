import { expect, type Page } from "@playwright/test";

/** Start met een schone lokale database (eerste gebruik). */
export async function fresh(page: Page, path = "/bibliotheek/") {
  await page.goto("/bibliotheek/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
  await expect(page.locator("main, body").first()).toBeVisible();
  await expect(page.getByText("FightLab laden…")).toHaveCount(0);
}

export async function openLessonFromTemplate(page: Page, template: string) {
  await page.goto("/lesmaker/");
  await page.getByTestId("new-lesson").click();
  await page.getByRole("tab", { name: "Vanuit lesstructuur" }).click();
  await page.getByTestId("template-option").filter({ hasText: template }).first().click();
  await expect(page.getByTestId("lesson-title")).toHaveValue(template);
}

export async function blockTitles(page: Page) {
  return page.getByTestId("lesson-block").evaluateAll((els) => els.map((e) => e.getAttribute("data-block-title")));
}
