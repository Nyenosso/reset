"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Printer } from "lucide-react";
import { goalLabel, organizationLabel, phaseLabel } from "@/lib/domain/vocab";
import { formatClock, formatRpe, formatWhiteboard } from "@/lib/time/format";
import { blockSeconds, describeStructure, lessonTotals } from "@/lib/time/structure";
import { useActiveLesson, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";

/** Printvriendelijke weergave; via ‘Afdrukken’ ook als PDF op te slaan. */
export function PrintView() {
  const params = useSearchParams();
  const lessons = useStore((s) => s.data.lessons);
  const active = useActiveLesson();
  const id = params.get("les");
  const lesson = (id ? lessons[id] : undefined) ?? active;
  if (!lesson) return <Empty title="Geen les gevonden" action={<Button asChild variant="primary"><Link href="/lessen/">Naar mijn lessen</Link></Button>} />;
  const t = lessonTotals(lesson);
  return (
    <div className="mx-auto max-w-3xl bg-white px-6 py-6 text-[#111] print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/lesmaker/">
            <ChevronLeft /> Terug
          </Link>
        </Button>
        <Button variant="primary" onClick={() => window.print()} data-testid="print-button">
          <Printer /> Afdrukken / PDF
        </Button>
      </div>
      <header className="border-b-2 border-[#111] pb-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#666]">Bokszaktraining</p>
        <h1 className="text-[26px] font-bold leading-tight" data-testid="print-title">{lesson.title}</h1>
        <p className="mt-1 text-[14px] text-[#444]">
          {[lesson.date, `${lesson.participants} deelnemers`, lesson.audience, lesson.goals.map(goalLabel).join(", "), `Totaal ${formatClock(t.planned)} / ${formatClock(t.target)}`].filter(Boolean).join(" · ")}
        </p>
        {lesson.notes && <p className="mt-2 text-[14px] italic">{lesson.notes}</p>}
      </header>
      <ol className="mt-4 flex flex-col gap-4">
        {lesson.blocks.map((b, i) => {
          const start = t.blocks[i]?.start ?? 0;
          return (
            <li key={b.id} className="print-break border-b border-[#ddd] pb-3">
              <div className="flex items-baseline gap-3">
                <span className="w-12 shrink-0 text-[12px] text-[#666] tabular">{formatClock(start)}</span>
                <h2 className="flex-1 text-[17px] font-bold uppercase">
                  {i + 1}. {b.title}
                </h2>
                <span className="text-[17px] font-bold tabular">{formatWhiteboard(blockSeconds(b))}</span>
              </div>
              <div className="ml-[60px] mt-1 space-y-1 text-[14px] leading-snug">
                <p className="text-[#555]">{[phaseLabel(b.phase), b.formatName, organizationLabel(b.organization), formatRpe(b.rpe)].filter(Boolean).join(" · ")}</p>
                {b.exercises.length > 0 && (
                  <p>
                    <b>Oefeningen:</b> {b.exercises.map((e) => [e.tag, e.name, e.amount && `(${e.amount})`].filter(Boolean).join(" ")).join(" / ")}
                  </p>
                )}
                {b.structure && (
                  <p>
                    <b>Structuur:</b> {describeStructure(b.structure)}
                    {b.structure.explainSec ? ` · uitleg ${b.structure.explainSec}s` : ""}
                    {b.structure.setupSec ? ` · opstellen ${b.structure.setupSec}s` : ""}
                    {b.structure.transitionSec ? ` · overgang ${b.structure.transitionSec}s` : ""}
                  </p>
                )}
                {b.instructions && <p><b>Opdracht:</b> {b.instructions}</p>}
                {b.partnerRoles && <p><b>Rollen:</b> {b.partnerRoles}</p>}
                {b.cues.length > 0 && <p><b>Cues:</b> {b.cues.join(" · ")}</p>}
                {(b.easier || b.harder) && (
                  <p>
                    <b>Differentiatie:</b> {[b.easier && `makkelijker: ${b.easier}`, b.harder && `moeilijker: ${b.harder}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-right text-[16px] font-bold">TOTAAL: {formatWhiteboard(t.planned)}</p>
    </div>
  );
}
