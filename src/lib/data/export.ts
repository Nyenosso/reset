import type { Lesson, LessonBlock } from "@/lib/domain/types";
import { goalLabel, organizationLabel, phaseLabel, statusLabel } from "@/lib/domain/vocab";
import { formatClock, formatRpe, formatWhiteboard } from "@/lib/time/format";
import { blockSeconds, describeStructure, lessonTotals } from "@/lib/time/structure";
import { SCHEMA_VERSION } from "./validation";

/** Korte inhoudsregel van een blok: oefeningen of commando’s. */
export function blockContentLine(b: LessonBlock): string {
  return b.exercises
    .map((e) => [e.tag && !/^R\d|^\d+$/.test(e.tag) ? `${e.tag}:` : "", e.name, e.amount ? `(${e.amount})` : ""].filter(Boolean).join(" "))
    .join(" / ");
}

function upper(s: string) {
  return s.toLocaleUpperCase("nl-NL");
}

/** Whiteboardtekst, geschikt voor Notion, notities of het fysieke bord. */
export function lessonToText(l: Lesson): string {
  const lines: string[] = [`BOKSZAKTRAINING — ${upper(l.title)}`];
  const meta = [l.date, `${l.participants} deelnemers`, l.audience].filter(Boolean).join(" · ");
  if (meta) lines.push(meta);
  lines.push("");
  l.blocks.forEach((b, i) => {
    lines.push(`${i + 1}. ${upper(b.title)} — ${formatWhiteboard(blockSeconds(b))}`);
    if (b.formatName && b.formatName !== b.title) lines.push(`    ${b.formatName}`);
    const content = blockContentLine(b);
    if (content) lines.push(`    ${content}`);
    if (b.structure && b.structure.intervals.length > 0 && b.structure.rounds * b.structure.intervals.length > 1) lines.push(`    ${describeStructure(b.structure)}`);
  });
  lines.push("");
  lines.push(`TOTAAL: ${formatWhiteboard(lessonTotals(l).planned)}`);
  return lines.join("\n");
}

export function lessonToMarkdown(l: Lesson): string {
  const t = lessonTotals(l);
  const out: string[] = [`# ${l.title}`, ""];
  const meta = [
    l.date ? `**Datum:** ${l.date}` : "",
    `**Duur:** ${formatClock(t.planned)} / ${formatClock(t.target)}`,
    `**Deelnemers:** ${l.participants}`,
    l.audience ? `**Doelgroep:** ${l.audience}` : "",
    l.goals.length ? `**Doelen:** ${l.goals.map(goalLabel).join(", ")}` : "",
    `**Status:** ${statusLabel(l.status)}`,
  ].filter(Boolean);
  out.push(meta.join(" · "), "");
  if (l.notes) out.push(`> ${l.notes}`, "");
  l.blocks.forEach((b, i) => {
    out.push(`## ${i + 1}. ${b.title} — ${formatWhiteboard(blockSeconds(b))}`);
    const facts = [phaseLabel(b.phase), b.formatName, organizationLabel(b.organization), formatRpe(b.rpe)].filter(Boolean);
    out.push(`*${facts.join(" · ")}*`, "");
    if (b.structure) out.push(`- **Structuur:** ${describeStructure(b.structure)}${b.structure.explainSec ? ` (+${b.structure.explainSec} s uitleg)` : ""}`);
    for (const e of b.exercises) out.push(`- ${e.tag ? `**${e.tag}** ` : ""}${e.name}${e.amount ? ` — ${e.amount}` : ""}`);
    if (b.instructions) out.push(`- **Instructie:** ${b.instructions}`);
    if (b.partnerRoles) out.push(`- **Rollen:** ${b.partnerRoles}`);
    if (b.cues.length) out.push(`- **Cues:** ${b.cues.join(" · ")}`);
    if (b.easier || b.harder) out.push(`- **Differentiatie:** ${[b.easier && `makkelijker: ${b.easier}`, b.harder && `moeilijker: ${b.harder}`].filter(Boolean).join("; ")}`);
    out.push("");
  });
  out.push(`**Totaal: ${formatWhiteboard(t.planned)}**`);
  return out.join("\n");
}

export function lessonToJson(l: Lesson): string {
  return JSON.stringify({ app: "FightLab", type: "lesson", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), lesson: l }, null, 2);
}

export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
