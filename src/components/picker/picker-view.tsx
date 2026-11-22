"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, Dices, Plus, RotateCcw } from "lucide-react";
import {
  DURATION_BUCKETS,
  EQUIPMENT,
  GOALS,
  INTENSITIES,
  ORGANIZATIONS,
  PHASES,
  type Equipment,
  type Goal,
  type Level,
  type Organization,
  type Phase,
} from "@/lib/domain/vocab";
import { recommendFormats, surprise, type Recommendation } from "@/lib/data/recommend";
import { formatDuration, formatRpe } from "@/lib/time/format";
import { useActiveLesson, useLibrary, useStore } from "@/lib/store";
import { useUi } from "@/lib/store/ui";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Chip, ChipGroup, Tag } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";
import { Empty } from "@/components/ui/empty";
import { More, Toggle } from "@/components/shared/form";
import { IncrementalList } from "@/components/shared/incremental-list";
import { cn } from "@/components/ui/cn";
import { addFormatAsBlock } from "@/components/library/actions";

const PICKER_GOALS = GOALS.filter((g) => g.id !== "mobiliteit" && g.id !== "herstel");

export function FormatPickerView() {
  const lib = useLibrary();
  const prefs = useStore((s) => s.data.prefs);
  const favorites = useStore((s) => s.data.favorites);
  const lesson = useActiveLesson();
  const f = useUi((s) => s.picker);
  const setPicker = useUi((s) => s.setPicker);
  const reset = useUi((s) => s.resetPicker);
  const router = useRouter();
  const [surprised, setSurprised] = React.useState<string | null>(null);
  const [customDur, setCustomDur] = React.useState(false);

  const ctx = React.useMemo(
    () => ({ participants: lesson?.participants ?? prefs.defaultParticipants, available: prefs.equipmentAvailable, counts: prefs.equipmentCounts, favorites: new Set(favorites) }),
    [lesson?.participants, prefs, favorites],
  );
  const recs = React.useMemo(() => recommendFormats(lib.formats, lib.exercises, f, ctx), [lib, f, ctx]);
  const surprisedRec = surprised ? recs.find((r) => r.format.id === surprised) : undefined;

  const intensityIds = INTENSITIES.filter((i) => f.rpe && i.range[0] >= f.rpe[0] && i.range[1] <= f.rpe[1]).map((i) => i.id);
  const durationId = DURATION_BUCKETS.find((b) => f.duration && b.range[0] === f.duration[0] && b.range[1] === f.duration[1])?.id ?? (f.duration ? "eigen" : "");

  const add = (r: Recommendation) => {
    const res = addFormatAsBlock(r.format, r.suggestedExercises, r.suggestedSec, f.phase);
    router.push(`/lesmaker/?blok=${res.blockId}`);
  };

  return (
    <>
      <PageHeader
        title="Formatkiezer"
        wide
        back={
          <Button asChild variant="ghost" size="iconSm" className="-ml-2" aria-label="Terug naar bibliotheek">
            <Link href="/bibliotheek/?tab=formats">
              <ChevronLeft />
            </Link>
          </Button>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => { reset(); setSurprised(null); setCustomDur(false); }} aria-label="Filters wissen">
              <RotateCcw />
            </Button>
            <Button variant="soft" size="sm" onClick={() => setSurprised(surprise(recs)?.format.id ?? null)} data-testid="surprise">
              <Dices /> Verras me
            </Button>
          </>
        }
      />
      <PageBody wide>
        <div className="md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-6">
          <section aria-label="Filters" className="flex flex-col gap-4 md:sticky md:top-[72px] md:self-start">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <Field label="Moment in de les">
                <Select value={f.phase ?? ""} onChange={(e) => setPicker({ phase: (e.target.value || undefined) as Phase | undefined })} aria-label="Moment in de les" data-testid="picker-phase">
                  <option value="">Alle momenten</option>
                  {PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Gewenste duur">
                <Select
                  value={customDur ? "eigen" : durationId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomDur(v === "eigen");
                    if (v === "eigen") setPicker({ duration: f.duration ?? [300, 480] });
                    else setPicker({ duration: DURATION_BUCKETS.find((b) => b.id === v)?.range });
                  }}
                  aria-label="Gewenste duur"
                  data-testid="picker-duration"
                >
                  <option value="">Elke duur</option>
                  {DURATION_BUCKETS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                  <option value="eigen">Eigen duur</option>
                </Select>
              </Field>
            </div>
            {customDur && f.duration && (
              <div className="flex items-center gap-2">
                <Stepper label="Minimale duur" value={Math.round(f.duration[0] / 60)} min={1} max={Math.round(f.duration[1] / 60)} format={(v) => `${v} min`} onChange={(v) => setPicker({ duration: [v * 60, f.duration![1]] })} />
                <span className="text-faint">tot</span>
                <Stepper label="Maximale duur" value={Math.round(f.duration[1] / 60)} min={Math.round(f.duration[0] / 60)} max={30} format={(v) => `${v} min`} onChange={(v) => setPicker({ duration: [f.duration![0], v * 60] })} />
              </div>
            )}
            <Field label="Trainingsdoel">
              <ChipGroup size="sm" options={PICKER_GOALS} value={f.goals} onChange={(goals) => setPicker({ goals: goals as Goal[] })} />
            </Field>
            <Field label="Intensiteit">
              <div className="flex flex-wrap gap-1.5">
                {INTENSITIES.map((i) => {
                  const on = intensityIds.includes(i.id);
                  return (
                    <Chip
                      key={i.id}
                      size="sm"
                      selected={on}
                      onClick={() => {
                        const next = on ? intensityIds.filter((x) => x !== i.id) : [...intensityIds, i.id];
                        const ranges = INTENSITIES.filter((x) => next.includes(x.id)).map((x) => x.range);
                        setPicker({ rpe: ranges.length ? [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))] : undefined });
                      }}
                    >
                      {i.label} <span className="text-[11px] opacity-70">{i.range[0]}–{i.range[1]}</span>
                    </Chip>
                  );
                })}
              </div>
            </Field>
            <Field label="Organisatie">
              <ChipGroup size="sm" multiple={false} options={ORGANIZATIONS} value={f.organization ? [f.organization] : []} onChange={(v) => setPicker({ organization: v[0] as Organization | undefined })} />
            </Field>
            <Field label="Materiaal">
              <ChipGroup size="sm" options={EQUIPMENT} value={f.equipment} onChange={(equipment) => setPicker({ equipment: equipment as Equipment[] })} />
            </Field>
            <More title="Extra filters">
              <Field label="Handschoenen">
                <Segmented label="Handschoenen" value={f.gloves ?? "x"} onChange={(v) => setPicker({ gloves: v === "x" ? undefined : (v as "aan" | "uit") })} options={[{ id: "x", label: "Maakt niet uit" }, { id: "aan", label: "Aan" }, { id: "uit", label: "Uit" }]} />
              </Field>
              <Field label="Technische moeilijkheid">
                <Segmented label="Moeilijkheid" value={String(f.difficulty ?? "x")} onChange={(v) => setPicker({ difficulty: v === "x" ? undefined : (Number(v) as Level) })} options={[{ id: "x", label: "Alle" }, { id: "1", label: "Basis" }, { id: "2", label: "Gemiddeld" }, { id: "3", label: "Gevorderd" }]} />
              </Field>
              <Field label="Logistieke complexiteit (maximaal)">
                <Segmented label="Logistiek" value={String(f.maxLogistics ?? "x")} onChange={(v) => setPicker({ maxLogistics: v === "x" ? undefined : (Number(v) as Level) })} options={[{ id: "x", label: "Alle" }, { id: "1", label: "Eenvoudig" }, { id: "2", label: "Gemiddeld" }]} />
              </Field>
              <Field label="Competitie">
                <Segmented label="Competitie" value={f.competition ?? "x"} onChange={(v) => setPicker({ competition: v === "x" ? undefined : (v as "ja" | "nee") })} options={[{ id: "x", label: "Maakt niet uit" }, { id: "ja", label: "Met" }, { id: "nee", label: "Zonder" }]} />
              </Field>
              <Field label="Partnerinteractie">
                <Segmented label="Partnerinteractie" value={f.interaction ?? "x"} onChange={(v) => setPicker({ interaction: v === "x" ? undefined : (v as "veel" | "weinig") })} options={[{ id: "x", label: "Maakt niet uit" }, { id: "veel", label: "Veel" }, { id: "weinig", label: "Weinig" }]} />
              </Field>
              <Toggle label="Alleen favorieten" checked={Boolean(f.favoritesOnly)} onChange={(favoritesOnly) => setPicker({ favoritesOnly })} />
              <Toggle label="Alleen uitvoerbaar met mijn materiaal en groep" checked={Boolean(f.onlyAvailable)} onChange={(onlyAvailable) => setPicker({ onlyAvailable })} hint={`${ctx.participants} deelnemers · ${prefs.equipmentCounts.bokszak} zakken`} />
            </More>
          </section>

          <section id="suggesties" aria-label="Suggesties" className="mt-6 scroll-mt-16 md:mt-0">
            {surprisedRec && (
              <div className="mb-4 rounded-xl border-2 border-accent/40 bg-accent-soft/40 p-1">
                <p className="px-2 pt-1 text-[12px] font-semibold uppercase tracking-wide text-accent">Verrassing</p>
                <RecCard r={surprisedRec} onAdd={() => add(surprisedRec)} />
              </div>
            )}
            <p className="mb-2 text-[13px] text-muted" aria-live="polite" data-testid="picker-count">
              {recs.length} {recs.length === 1 ? "format" : "formats"} · beste match bovenaan
            </p>
            {recs.length === 0 ? (
              <Empty title="Geen passende formats">Probeer minder filters of zet ‘alleen uitvoerbaar’ uit.</Empty>
            ) : (
              <IncrementalList items={recs} getKey={(r) => r.format.id} initial={15} step={20} className="flex flex-col gap-2" render={(r) => <RecCard r={r} onAdd={() => add(r)} />} />
            )}
          </section>
        </div>
        <div className="h-16 md:hidden" aria-hidden />
      </PageBody>
      <div className="no-print fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-bg/95 px-4 py-2 backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => document.getElementById("suggesties")?.scrollIntoView({ behavior: "smooth" })}
          className="flex h-11 w-full items-center justify-between rounded-lg bg-ink px-4 text-[15px] font-medium text-white"
          data-testid="picker-jump"
        >
          <span className="truncate">{recs.length} formats{recs[0] ? ` · beste: ${recs[0].format.name}` : ""}</span>
          <span className="shrink-0">Bekijk ↓</span>
        </button>
      </div>
    </>
  );
}

function RecCard({ r, onAdd }: { r: Recommendation; onAdd: () => void }) {
  const f = r.format;
  return (
    <article className={cn("rounded-xl border bg-surface p-3", r.feasible ? "border-line" : "border-dashed border-line-strong opacity-80")} data-testid="rec-card">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold leading-tight">{f.name}</h3>
          <p className="mt-0.5 text-[14px] text-muted">{f.description}</p>
        </div>
        <ScoreRing score={r.score} feasible={r.feasible} />
      </div>
      {r.reasons.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Waarom dit past">
          {r.reasons.slice(0, 5).map((x) => (
            <li key={x}>
              <Tag tone="ok">
                <Check className="size-3.5" /> {x}
              </Tag>
            </li>
          ))}
        </ul>
      )}
      {r.warnings.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Aandachtspunten">
          {r.warnings.slice(0, 3).map((x) => (
            <li key={x}>
              <Tag tone="warn">
                <AlertTriangle className="size-3.5" /> {x}
              </Tag>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[13px] text-muted tabular">
        {formatDuration(r.suggestedSec)} · {formatRpe(f.rpe)}
        {r.suggestedExercises.length > 0 && ` · ${r.suggestedExercises.map((e) => e.name).join(", ")}`}
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/bibliotheek/?tab=formats&item=format:${f.id}`}>Bekijk</Link>
        </Button>
        <Button variant="primary" size="sm" onClick={onAdd} data-testid="rec-add">
          <Plus /> Voeg toe
        </Button>
      </div>
    </article>
  );
}

function ScoreRing({ score, feasible }: { score: number; feasible: boolean }) {
  const label = !feasible ? "Niet uitvoerbaar" : score >= 80 ? "Zeer passend" : score >= 60 ? "Passend" : "Matig passend";
  return (
    <div className="flex shrink-0 flex-col items-end" title={`Match ${score}/100`}>
      <span className={cn("text-[15px] font-semibold tabular", !feasible ? "text-warn" : score >= 60 ? "text-ok" : "text-muted")}>{score}</span>
      <span className="text-[11px] text-faint">{label}</span>
    </div>
  );
}
