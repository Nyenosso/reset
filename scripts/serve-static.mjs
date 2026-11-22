// Minimale statische server voor de export in `out/` (voor lokaal bekijken en e2e-tests).
// Gebruik: node scripts/serve-static.mjs [map=out] [poort=4173]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".txt": "text/plain", ".woff2": "font/woff2",
};

async function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let p = join(root, safe);
  try {
    const s = await stat(p);
    if (s.isDirectory()) p = join(p, "index.html");
    await stat(p);
    return p;
  } catch {
    try {
      await stat(`${p}.html`);
      return `${p}.html`;
    } catch {
      return null;
    }
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.endsWith("/") && !extname(url.pathname)) {
    res.writeHead(308, { Location: `${url.pathname}/${url.search}` });
    return res.end();
  }
  const file = await resolveFile(url.pathname);
  if (!file) {
    const nf = await readFile(join(root, "404.html")).catch(() => Buffer.from("Not found"));
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(nf);
  }
  const body = await readFile(file);
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(body);
}).listen(port, "127.0.0.1", () => console.log(`FightLab draait op http://127.0.0.1:${port}`));
