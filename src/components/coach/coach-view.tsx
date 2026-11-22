"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { organizationLabel, phaseLabel } from "@/lib/domain/vocab";
import { buildTimeline, firstStepOfBlock, totalSeconds, type Step } from "@/lib/coach/timeline";
import { useCoachTimer } from "@/lib/coach/use-coach-timer";
import { wakeLockSupported } from "@/lib/coach/signals";
import { formatClock, formatDuration, formatRpe, formatWhiteboard } from "@/lib/time/format";
import { blockSeconds, describeStructure } from "@/lib/time/structure";
import { blockContentLine } from "@/lib/data/export";
import { useActiveLesson, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/components/ui/cn";

export function CoachView() {
  const params = useSearchParams();
  const lessons = useStore((s) => s.data.lessons);
  const active = useActiveLesson();
  const id = params.get("les");
  const lesson = (id ? lessons[id] : undefined) ?? active;
  if (!lesson || lesson.blocks.length === 0) {
    return (
      <div className="min-h-dvh bg-bg">
        <Empty title="Geen les om te coachen" action={<Button asChild variant="primary"><Link href="/lessen/">Kies een les</Link></Button>}>
          Open een les met minstens één blok en start daar de coachmodus.
        </Empty>
      </div>
    );
  }
  return <Coach key={lesson.id} lesson={lesson} />;
}

function Coach({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const prefs = useStore((s) => s.data.prefs);
  const updatePrefs = useStore((s) => s.updatePrefs);
  const steps = React.useMemo(() => buildTimeline(lesson), [lesson]);
  const total = React.useMemo(() => totalSeconds(steps), [steps]);
  const [mode, setMode] = React.useState<"timer" | "lezen">("timer");
  const [showCues, setShowCues] = React.useState(false);
  const t = useCoachTimer(steps, { storageKey: `fightlab:coach:${lesson.id}`, sound: prefs.soundEnabled, vibration: prefs.vibrationEnabled, keepScreenOn: prefs.keepScreenOn });
  const step = t.current;
  const block = step ? lesson.blocks[step.blockIndex] : undefined;
  const nextStep = steps[t.index + 1];
  const nextBlock = block ? lesson.blocks[step!.blockIndex + 1] : undefined;
  const sec = Math.ceil(t.remainingMs / 1000);
  const elapsed = step ? step.startSec + (step.seconds - t.remainingMs / 1000) : 0;
  const stepPct = step ? Math.min(100, ((step.seconds * 1000 - t.remainingMs) / (step.seconds * 1000)) * 100) : 0;

  // Toetsenbord: spatie = start/pauze, pijlen = vorige/volgende.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        if (t.running) t.pause();
        else t.start();
      }
      if (e.key === "ArrowRight") t.next();
      if (e.key === "ArrowLeft") t.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#141311] text-[#f4f2ec]">
      <header className="flex items-center gap-2 px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button type="button" onClick={() => router.push("/lesmaker/")} aria-label="Coachmodus sluiten" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <X className="size-6" />
        </button>
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-white/80">{lesson.title}</p>
        <button type="button" onClick={() => updatePrefs({ soundEnabled: !prefs.soundEnabled })} aria-label={prefs.soundEnabled ? "Geluid uit" : "Geluid aan"} aria-pressed={prefs.soundEnabled} className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          {prefs.soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </header>
      <div className="px-4 pt-1">
        <div role="tablist" aria-label="Weergave" className="flex rounded-xl bg-white/10 p-1">
          {(["timer", "lezen"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={cn("h-9 flex-1 rounded-lg text-sm font-medium", mode === m ? "bg-white text-[#141311]" : "text-white/70")}>
              {m === "timer" ? "Timer" : "Leesmodus"}
            </button>
          ))}
        </div>
      </div>

      {mode === "lezen" ? (
        <ReadMode lesson={lesson} currentBlock={step?.blockIndex ?? -1} onJump={(bi) => { t.jump(firstStepOfBlock(steps, bi)); setMode("timer"); }} />
      ) : step && block ? (
        <main className="flex flex-1 flex-col px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-4" aria-live="polite">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#ff8a5c]" data-testid="coach-block">
            Blok {step.blockIndex + 1} — {block.title}
          </p>
          {blockContentLine(block) && <p className="mt-1 text-[17px] font-medium leading-snug text-white/90">{blockContentLine(block)}</p>}
          <div className="mt-6 text-center">
            <p className={cn("text-[22px] font-semibold", step.kind === "work" ? "text-white" : "text-white/70")} data-testid="coach-step">
              {step.label}
            </p>
            {step.text && <p className="mx-auto mt-1 max-w-md text-[16px] text-white/75">{step.text}</p>}
            <p className={cn("mt-2 font-semibold leading-none tabular tracking-tight", sec <= 3 && t.running ? "text-[#ff8a5c]" : "text-white")} style={{ fontSize: "clamp(88px, 30vw, 180px)" }} data-testid="coach-clock">
              {formatClock(sec)}
            </p>
            {step.round && step.rounds && step.rounds > 1 && <p className="mt-1 text-[17px] text-white/75">Ronde {step.round} van {step.rounds}</p>}
            <div className="mx-auto mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-[#ff8a5c]" style={{ width: `${stepPct}%` }} />
            </div>
          </div>
          {block.structure && <RoundStrip steps={steps} index={t.index} />}
          <div className="mt-5 space-y-1 text-[15px]">
            {nextStep && (
              <p className="text-white/70">
                Volgende: <span className="font-medium text-white">{nextStep.blockIndex === step.blockIndex ? `${nextStep.label} · ${formatClock(nextStep.seconds)}` : `${lesson.blocks[nextStep.blockIndex].title}`}</span>
              </p>
            )}
            {nextBlock && <p className="text-white/50">Volgend blok: {nextBlock.title} · {formatWhiteboard(blockSeconds(nextBlock))}</p>}
          </div>
          {(block.cues.length > 0 || block.partnerRoles) && (
            <div className="mt-4 rounded-xl bg-white/5">
              <button type="button" className="flex h-11 w-full items-center justify-between px-3 text-[15px] font-medium" onClick={() => setShowCues(!showCues)} aria-expanded={showCues}>
                Coaching cues & rollen
                <ChevronDown className={cn("size-5 transition-transform", showCues && "rotate-180")} />
              </button>
              {showCues && (
                <div className="space-y-2 px-3 pb-3 text-[15px] text-white/80">
                  {block.partnerRoles && <p>{block.partnerRoles}</p>}
                  <ul className="list-disc pl-5">
                    {block.cues.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <p className="mt-auto pt-6 text-center text-[13px] text-white/50 tabular">
            {t.running ? "Loopt" : "Gepauzeerd"} · les {formatClock(Math.floor(elapsed))} / {formatClock(total)}
            {!wakeLockSupported() && " · zet automatische vergrendeling uit tijdens de les"}
          </p>
        </main>
      ) : null}

      {mode === "timer" && (
        <nav aria-label="Timerbediening" className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-[#141311]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <CtrlButton label="Opnieuw beginnen" onClick={t.reset}>
            <RotateCcw className="size-6" />
          </CtrlButton>
          <CtrlButton label="Vorig interval" onClick={t.prev}>
            <SkipBack className="size-7" />
          </CtrlButton>
          <button
            type="button"
            onClick={t.running ? t.pause : t.start}
            aria-label={t.running ? "Pauzeren" : "Starten"}
            className="grid size-20 place-items-center rounded-full bg-[#ff8a5c] text-[#141311] shadow-lg active:scale-95"
            data-testid="coach-toggle"
          >
            {t.running ? <Pause className="size-9" fill="currentColor" /> : <Play className="ml-1 size-9" fill="currentColor" />}
          </button>
          <CtrlButton label="Volgend interval" onClick={t.next}>
            <SkipForward className="size-7" />
          </CtrlButton>
        </nav>
      )}
    </div>
  );
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-14 place-items-center rounded-full text-white/90 hover:bg-white/10 active:bg-white/15">
      {children}
    </button>
  );
}

function RoundStrip({ steps, index }: { steps: Step[]; index: number }) {
  const cur = steps[index];
  if (!cur.round) return null;
  const same = steps.filter((s) => s.blockIndex === cur.blockIndex && s.round === cur.round && s.kind !== "rest");
  return (
    <ol className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-1.5" aria-label="Intervallen in deze ronde">
      {same.map((s) => (
        <li key={s.id} className={cn("rounded-lg px-2.5 py-1 text-[14px] tabular", s.id === cur.id ? "bg-white text-[#141311]" : s.kind === "work" ? "bg-white/15 text-white" : "bg-white/5 text-white/60")}>
          {s.seconds}s {s.label}
        </li>
      ))}
    </ol>
  );
}

function ReadMode({ lesson, currentBlock, onJump }: { lesson: Lesson; currentBlock: number; onJump: (i: number) => void }) {
  return (
    <main className="flex-1 px-4 pb-10 pt-4">
      <ol className="flex flex-col gap-2">
        {lesson.blocks.map((b, i) => (
          <li key={b.id} className={cn("rounded-xl p-3", i === currentBlock ? "bg-white/15" : "bg-white/5")}>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-white/50 tabular">{i + 1}.</span>
              <span className="flex-1 font-semibold uppercase tracking-wide">{b.title}</span>
              <span className="font-semibold tabular">{formatWhiteboard(blockSeconds(b))}</span>
            </div>
            {b.formatName && <p className="mt-0.5 text-[15px] text-white/80">{b.formatName}</p>}
            {blockContentLine(b) && <p className="text-[15px] text-white/80">{blockContentLine(b)}</p>}
            {b.structure && <p className="text-[14px] text-white/60">{describeStructure(b.structure)}</p>}
            <p className="text-[13px] text-white/50">{[phaseLabel(b.phase), organizationLabel(b.organization), formatRpe(b.rpe), formatDuration(blockSeconds(b))].join(" · ")}</p>
            {b.instructions && <p className="mt-1 text-[14px] text-white/70">{b.instructions}</p>}
            <button type="button" onClick={() => onJump(i)} className="mt-2 text-[14px] font-medium text-[#ff8a5c]">
              Start timer vanaf dit blok
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
