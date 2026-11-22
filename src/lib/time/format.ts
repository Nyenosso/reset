import type { Seconds } from "@/lib/domain/types";

const pad = (n: number) => String(n).padStart(2, "0");

/** 3270 → "54:30"; 3780 → "63:00"; negatieve waarden krijgen een minteken. */
export function formatClock(sec: Seconds): string {
  const s = Math.round(sec);
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  return `${sign}${Math.floor(abs / 60)}:${pad(abs % 60)}`;
}

/** Whiteboardnotatie: 480 → "8’", 390 → "6’30”", 45 → "45”". */
export function formatWhiteboard(sec: Seconds): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}”`;
  return r === 0 ? `${m}’` : `${m}’${pad(r)}”`;
}

/** Leesbare duur: 480 → "8 min", 390 → "6:30 min", 45 → "45 sec". */
export function formatDuration(sec: Seconds): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} min` : `${m}:${pad(r)} min`;
}

/** Bereik in seconden als tekst: [20,40] → "20–40 sec", [240,480] → "4–8 min". */
export function formatRange([a, b]: [number, number]): string {
  if (b < 60) return a === b ? `${a} sec` : `${a}–${b} sec`;
  if (a % 60 === 0 && b % 60 === 0) return a === b ? `${a / 60} min` : `${a / 60}–${b / 60} min`;
  return `${formatDuration(a)}–${formatDuration(b)}`;
}

export function formatRpe([a, b]: [number, number]): string {
  return a === b ? `RPE ${a}` : `RPE ${a}–${b}`;
}

/**
 * Parseert gebruikersinvoer naar seconden.
 * "6" → 360 (minuten), "6:30" → 390, "90s" / "90 sec" → 90, "1m30" → 90, "2 min" → 120.
 */
export function parseDuration(input: string): Seconds | null {
  const t = input.trim().toLowerCase().replace(",", ".");
  if (!t) return null;
  let m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(\d+(?:\.\d+)?)\s*(s|sec|seconden|”|")$/);
  if (m) return Math.round(Number(m[1]));
  m = t.match(/^(\d+)\s*m(?:in)?\s*(\d+)\s*(s|sec)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(\d+(?:\.\d+)?)\s*(m|min|minuten|’|')?$/);
  if (m) return Math.round(Number(m[1]) * 60);
  return null;
}
