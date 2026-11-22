"use client";

import * as React from "react";
import type { Exercise, Format, LessonTemplate, TrainingBlock } from "@/lib/domain/types";
import {
  DIFFICULTY_LABELS,
  LOGISTICS_LABELS,
  categoryLabel,
  equipmentLabel,
  formatSectionLabel,
  gloveFitLabel,
  goalLabel,
  muscleLabel,
  organizationLabel,
  originLabel,
  patternLabel,
  phaseLabel,
} from "@/lib/domain/vocab";
import { formatDuration, formatRange, formatRpe } from "@/lib/time/format";
import { blockSeconds, describeStructure, describeWorkRest, structureBreakdown, structureSeconds } from "@/lib/time/structure";
import { useLibrary } from "@/lib/store";
import { Tag } from "@/components/ui/chip";

export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0));
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-subtle/60 p-3">
      {shown.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-faint">{k}</dt>
          <dd className="text-[14px] font-medium leading-snug">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <section className="mt-5">
      <h3 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-faint">{title}</h3>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 marker:text-faint">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export function ExerciseDetail({ e }: { e: Exercise }) {
  return (
    <div>
      <p className="text-[15px] text-muted">{e.description}</p>
      {e.aliases?.length ? <p className="mt-1 text-[13px] text-faint">Ook: {e.aliases.join(", ")}</p> : null}
      <Section title="Uitvoering">
        <p>{e.instructions}</p>
      </Section>
      <div className="mt-4">
        <Facts
          items={[
            ["Duur", e.reps ? `${formatRange(e.durationSec)} of ${e.reps}` : formatRange(e.durationSec)],
            ["Intensiteit", formatRpe(e.rpe)],
            ["Handschoenen", gloveFitLabel(e.gloves)],
            ["Moeilijkheid", DIFFICULTY_LABELS[e.difficulty]],
            ["Spiergroepen", e.musclesPrimary.map(muscleLabel).join(", ")],
            ["Secundair", e.musclesSecondary.map(muscleLabel).join(", ")],
            ["Patroon", patternLabel(e.pattern)],
            ["Materiaal", e.equipment.map(equipmentLabel).join(", ")],
            ["Lesfase", e.phases.map(phaseLabel).join(", ")],
            ["Organisatie", e.organization.map(organizationLabel).join(", ")],
          ]}
        />
      </div>
      <Section title="Coaching cues">
        <Bullets items={e.cues} />
      </Section>
      {e.mistakes.length > 0 && (
        <Section title="Veelvoorkomende fouten">
          <Bullets items={e.mistakes} />
        </Section>
      )}
      {e.safety && (
        <Section title="Veiligheid">
          <p>{e.safety}</p>
        </Section>
      )}
      {(e.easier || e.harder || e.progression) && (
        <Section title="Varianten">
          <ul className="space-y-1">
            {e.easier && <li><span className="text-faint">Eenvoudiger: </span>{e.easier}</li>}
            {e.harder && <li><span className="text-faint">Gevorderd: </span>{e.harder}</li>}
            {e.progression && <li><span className="text-faint">Progressie: </span>{e.progression}</li>}
          </ul>
        </Section>
      )}
      <Section title="Kenmerken">
        <div className="flex flex-wrap gap-1.5">
          {e.categories.map((c) => <Tag key={c}>{categoryLabel(c)}</Tag>)}
          {e.goals.map((g) => <Tag key={g} tone="accent">{goalLabel(g)}</Tag>)}
          {e.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
      </Section>
      {e.notes && (
        <Section title="Eigen notities">
          <p className="whitespace-pre-wrap">{e.notes}</p>
        </Section>
      )}
      <p className="mt-6 text-xs text-faint">Herkomst: {originLabel(e.origin)}{e.sourceNote ? ` · ${e.sourceNote}` : ""}</p>
    </div>
  );
}

export function FormatDetail({ f }: { f: Format }) {
  const lib = useLibrary();
  const ex = f.exerciseIds.map((id) => lib.exercise.get(id)).filter(Boolean) as Exercise[];
  return (
    <div>
      <p className="text-[15px] text-muted">{f.description}</p>
      <Section title="Hoe werkt het?">
        <p className="font-medium">{f.rule}</p>
        <p className="mt-2 rounded-xl border border-line bg-subtle/50 p-3 text-[14px]"><span className="font-semibold">Voorbeeld: </span>{f.example}</p>
      </Section>
      <div className="mt-4">
        <Facts
          items={[
            ["Doel", [f.mainGoal, ...f.goals].map(goalLabel).join(", ")],
            ["Duur", formatRange(f.durationSec)],
            ["Intensiteit", formatRpe(f.rpe)],
            ["Organisatie", f.organization.map(organizationLabel).join(", ")],
            ["Lesfase", f.phases.map(phaseLabel).join(", ")],
            ["Materiaal", f.equipment.map(equipmentLabel).join(", ")],
          ]}
        />
      </div>
      <Section title="Wisselen">
        <p>{f.switchRule}</p>
      </Section>
      <Section title="Partnerrollen">
        <p>{f.partnerRoles}</p>
      </Section>
      {ex.length > 0 && (
        <Section title="Passende oefeningen">
          <div className="flex flex-wrap gap-1.5">{ex.map((e) => <Tag key={e.id}>{e.name}</Tag>)}</div>
        </Section>
      )}
      <Section title="Werkstructuur">
        <p>{f.intervalText}</p>
        <p className="text-[14px] text-muted">{f.workRest} · standaard {formatDuration(structureSeconds(f.structure))} incl. uitleg</p>
      </Section>
      <Section title="Coaching cues">
        <Bullets items={f.cues} />
      </Section>
      {(f.beginner || f.advanced) && (
        <Section title="Differentiatie">
          <ul className="space-y-1">
            {f.beginner && <li><span className="text-faint">Beginners: </span>{f.beginner}</li>}
            {f.advanced && <li><span className="text-faint">Gevorderden: </span>{f.advanced}</li>}
          </ul>
        </Section>
      )}
      {f.community && (
        <Section title="Groepsdynamiek">
          <p>{f.community}</p>
        </Section>
      )}
      {(f.pros.length > 0 || f.cons.length > 0) && (
        <Section title="Voor- en nadelen">
          <ul className="space-y-1">
            {f.pros.map((p, i) => <li key={`p${i}`}>＋ {p}</li>)}
            {f.cons.map((c, i) => <li key={`c${i}`} className="text-muted">− {c}</li>)}
          </ul>
        </Section>
      )}
      <div className="mt-4">
        <Facts
          items={[
            ["Handschoenen", f.gloveLogistics],
            ["Logistiek", LOGISTICS_LABELS[f.logistics]],
            ["Technisch", DIFFICULTY_LABELS[f.difficulty]],
            ["Competitie", f.competitive ? "Ja" : "Nee"],
            ["Partnerinteractie", f.partnerInteraction],
            ["Max. deelnemers", f.maxParticipants ? String(f.maxParticipants) : "Tot 32+"],
          ]}
        />
      </div>
      {f.notes && (
        <Section title="Notities">
          <p className="whitespace-pre-wrap">{f.notes}</p>
        </Section>
      )}
      <p className="mt-6 text-xs text-faint">{formatSectionLabel(f.section)} · Herkomst: {originLabel(f.origin)}{f.sourceNote ? ` · ${f.sourceNote}` : ""}</p>
    </div>
  );
}

export function StructureTable({ s }: { s: NonNullable<TrainingBlock["structure"]> }) {
  return (
    <div className="rounded-xl border border-line">
      <ul className="divide-y divide-line">
        {s.intervals.map((iv) => (
          <li key={iv.id} className="flex items-baseline gap-3 px-3 py-2 text-[14px]">
            <span className="w-12 shrink-0 font-semibold tabular">{iv.seconds}s</span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{iv.label}</span>
              {iv.text && <span className="text-muted"> — {iv.text}</span>}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-subtle/50 px-3 py-2 text-[13px] text-muted">
        {structureBreakdown(s).map((r) => `${r.label}: ${formatDuration(r.seconds)}`).join(" · ")}
      </div>
    </div>
  );
}

export function BlockDetail({ b }: { b: TrainingBlock }) {
  return (
    <div>
      <p className="text-[15px] text-muted">{b.description}</p>
      <div className="mt-4">
        <Facts
          items={[
            ["Duur", formatDuration(blockSeconds(b))],
            ["Doel", b.goals.map(goalLabel).join(", ")],
            ["Format", b.formatName],
            ["Organisatie", organizationLabel(b.organization)],
            ["Materiaal", b.equipment.map(equipmentLabel).join(", ")],
            ["Intensiteit", formatRpe(b.rpe)],
          ]}
        />
      </div>
      <Section title="Opdracht">
        <p>{b.instructions}</p>
      </Section>
      {b.exercises.length > 0 && (
        <Section title="Oefeningen">
          <ul className="space-y-1">
            {b.exercises.map((e) => (
              <li key={e.id}>
                {e.tag && <span className="mr-1.5 font-semibold">{e.tag}</span>}
                {e.name}
                {e.amount && <span className="text-muted"> — {e.amount}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {b.structure && (
        <Section title="Werkstructuur">
          <p className="mb-2 text-[14px] text-muted">{describeStructure(b.structure)} · {describeWorkRest(b.structure)}</p>
          <StructureTable s={b.structure} />
        </Section>
      )}
      {b.partnerRoles && (
        <Section title="Partnerrollen">
          <p>{b.partnerRoles}</p>
        </Section>
      )}
      <Section title="Coaching cues">
        <Bullets items={b.cues} />
      </Section>
      {(b.easier || b.harder) && (
        <Section title="Differentiatie">
          <ul className="space-y-1">
            {b.easier && <li><span className="text-faint">Makkelijker: </span>{b.easier}</li>}
            {b.harder && <li><span className="text-faint">Moeilijker: </span>{b.harder}</li>}
          </ul>
        </Section>
      )}
      {b.notes && (
        <Section title="Notities">
          <p className="whitespace-pre-wrap">{b.notes}</p>
        </Section>
      )}
    </div>
  );
}

export function TemplateDetail({ t }: { t: LessonTemplate }) {
  const total = t.slots.reduce((a, s) => a + s.durationSec, 0);
  return (
    <div>
      <p className="text-[15px] text-muted">{t.description}</p>
      {t.slots.length > 0 ? (
        <ol className="mt-4 divide-y divide-line rounded-xl border border-line">
          {t.slots.map((s, i) => (
            <li key={s.id} className="flex items-baseline gap-3 px-3 py-2.5">
              <span className="w-6 shrink-0 text-[13px] font-semibold text-faint tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{s.title}</span>
                <span className="block text-[13px] text-muted">{phaseLabel(s.phase)}{s.hint ? ` · ${s.hint}` : ""}</span>
              </span>
              <span className="font-medium tabular">{Math.round(s.durationSec / 60)}’</span>
            </li>
          ))}
          <li className="flex justify-between px-3 py-2.5 font-semibold">
            <span>Totaal</span>
            <span className="tabular">{formatDuration(total)}</span>
          </li>
        </ol>
      ) : (
        <p className="mt-4 text-[15px]">Een lege les van 60 minuten. Je voegt zelf blokken toe.</p>
      )}
      {t.focus.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">{t.focus.map((g) => <Tag key={g} tone="accent">{goalLabel(g)}</Tag>)}</div>
      )}
    </div>
  );
}
