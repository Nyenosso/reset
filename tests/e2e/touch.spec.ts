import { expect, test } from "@playwright/test";
import { blockTitles, fresh, openLessonFromTemplate } from "./helpers";

/** Echte touch-gebaren via het Chrome DevTools Protocol (alleen iPhone-project). */
test("mobiel slepen met de vinger via de sleepgreep", async ({ page, browserName }, info) => {
  test.skip(info.project.name !== "iphone" || browserName !== "chromium", "alleen mobiel");
  await fresh(page, "/lesmaker/");
  await openLessonFromTemplate(page, "Back to Basics");
  const before = await blockTitles(page);
  const handle = page.getByTestId("drag-handle").nth(1);
  await handle.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const hb = (await handle.boundingBox())!;
  const tb = (await page.getByTestId("lesson-block").nth(3).boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = hb.x + hb.width / 2;
  const y0 = hb.y + hb.height / 2;
  const y1 = tb.y + tb.height * 0.6;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 15; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 15 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const after = await blockTitles(page);
  expect(after[3]).toBe(before[1]);
  expect(after).toHaveLength(before.length);
});

test("verticaal swipen op een blokkaart scrolt en start geen sleepactie", async ({ page, browserName }, info) => {
  test.skip(info.project.name !== "iphone" || browserName !== "chromium", "alleen mobiel");
  await fresh(page, "/lesmaker/");
  await openLessonFromTemplate(page, "Back to Basics");
  const before = await blockTitles(page);
  const card = page.getByTestId("lesson-block").nth(1).getByRole("button").first();
  const cb = (await card.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = cb.x + 40;
  const y0 = cb.y + cb.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - i * 20 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  expect(await blockTitles(page)).toEqual(before);
  await expect(page.getByLabel("Titel van het blok")).toHaveCount(0);
});
