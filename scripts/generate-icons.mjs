// Genereert de app-iconen (PNG) uit een eenvoudige SVG met de meegeleverde Chromium/Playwright.
// Gebruik: npm run icons
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const svg = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#c2410c"/>
  <g transform="translate(256 256) scale(${pad ? 0.72 : 1}) translate(-256 -256)">
    <text x="256" y="318" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-weight="800" font-size="200" letter-spacing="-8" fill="#fff">FL</text>
    <rect x="156" y="356" width="200" height="22" rx="11" fill="#fff" opacity="0.85"/>
  </g>
</svg>`;

const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
  ["favicon-32.png", 32, false],
];

await mkdir("public/icons", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, pad)}</body></html>`);
  await page.locator("svg").screenshot({ path: `public/icons/${name}`, omitBackground: true });
  console.log("✓", name);
}
await browser.close();
