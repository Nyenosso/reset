"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Layers, PlusCircle, Replace } from "lucide-react";
import type { Exercise, Format, LessonTemplate, TrainingBlock } from "@/lib/domain/types";
import { phaseShort } from "@/lib/domain/vocab";
import { useActiveLesson } from "@/lib/store";
import { Sheet } from "@/components/ui/sheet";
import {
  addExerciseAsBlock,
  addExerciseToExistingBlock,
  addFormatAsBlock,
  addTrainingBlock,
  applyFormatToExistingBlock,
  fillSlotWithTraining,
  startLessonFromTemplate,
} from "./actions";

export type AddTarget = { kind: "exercise"; item: Exercise } | { kind: "format"; item: Format } | { kind: "block"; item: TrainingBlock } | { kind: "template"; item: LessonTemplate };

function Option({ icon, title, sub, onClick, testId }: { icon: React.ReactNode; title: string; sub?: string; onClick: () => void; testId?: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-subtle">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted [&_svg]:size-[18px]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {sub && <span className="block truncate text-[13px] text-muted">{sub}</span>}
      </span>
    </button>
  );
}

/**
 * Keuze: als nieuw blok, in een bestaand blok, of een tijdslot vullen.
 * Een trainingsblok of lesstructuur heeft geen keuze nodig en wordt direct verwerkt (zie useAddToLesson).
 */
export function AddSheet({ target, onClose }: { target: AddTarget | null; onClose: () => void }) {
  const lesson = useActiveLesson();
  const router = useRouter();
  const open = target !== null && (target.kind === "exercise" || target.kind === "format" || (target.kind === "block" && Boolean(lesson?.blocks.some((b) => b.placeholder))));
  if (!target) return null;
  const blocks = lesson?.blocks ?? [];
  const done = () => onClose();
  const title = target.kind === "exercise" ? target.item.name : target.kind === "format" ? target.item.name : target.kind === "block" ? target.item.title : target.item.name;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()} title={`${title} toevoegen`} description={lesson ? `Aan: ${lesson.title}` : "Er wordt een nieuwe les aangemaakt."} size="sm">
      <div className="flex flex-col gap-1">
        {target.kind === "exercise" && (
          <>
            <Option testId="add-as-new-block" icon={<PlusCircle />} title="Als nieuw blok" sub="Eenvoudig standaardblok met deze oefening" onClick={() => { addExerciseAsBlock(target.item); done(); }} />
            {blocks.length > 0 && <p className="mt-3 px-2 text-xs font-medium text-faint">Toevoegen aan bestaand blok</p>}
            {blocks.map((b, i) => (
              <Option key={b.id} icon={<Layers />} title={`${String(i + 1).padStart(2, "0")} — ${b.title}`} sub={[phaseShort(b.phase), b.formatName, `${b.exercises.length} oefeningen`].filter(Boolean).join(" · ")} onClick={() => { addExerciseToExistingBlock(target.item, b.id); done(); }} />
            ))}
          </>
        )}
        {target.kind === "format" && (
          <>
            <Option testId="add-as-new-block" icon={<PlusCircle />} title="Als nieuw blok" sub="Met de standaardstructuur van dit format" onClick={() => { const r = addFormatAsBlock(target.item); done(); router.push(`/lesmaker/?blok=${r.blockId}`); }} />
            {blocks.length > 0 && <p className="mt-3 px-2 text-xs font-medium text-faint">Werkstructuur toepassen op</p>}
            {blocks.map((b, i) => (
              <Option key={b.id} icon={<Replace />} title={`${String(i + 1).padStart(2, "0")} — ${b.title}`} sub={[phaseShort(b.phase), b.formatName ?? "geen format"].join(" · ")} onClick={() => { applyFormatToExistingBlock(target.item, b.id); done(); }} />
            ))}
          </>
        )}
        {target.kind === "block" && (
          <>
            <Option testId="add-as-new-block" icon={<PlusCircle />} title="Als nieuw blok aan het eind" onClick={() => { addTrainingBlock(target.item); done(); }} />
            <p className="mt-3 px-2 text-xs font-medium text-faint">Tijdslot invullen</p>
            {blocks.map((b, i) =>
              b.placeholder ? (
                <Option key={b.id} icon={<Replace />} title={`${String(i + 1).padStart(2, "0")} — ${b.title}`} sub={`${Math.round(b.durationSec / 60)} min · nog leeg`} onClick={() => { fillSlotWithTraining(target.item, b.id); done(); }} />
              ) : null,
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Eén-tik toevoegen waar dat kan; anders opent de keuzesheet. */
export function useAddToLesson() {
  const [target, setTarget] = React.useState<AddTarget | null>(null);
  const lesson = useActiveLesson();
  const router = useRouter();
  const add = React.useCallback(
    (t: AddTarget, targetBlockId?: string) => {
      if (t.kind === "template") {
        startLessonFromTemplate(t.item);
        router.push("/lesmaker/");
        return;
      }
      if (targetBlockId && lesson?.blocks.some((b) => b.id === targetBlockId)) {
        if (t.kind === "exercise") return void addExerciseToExistingBlock(t.item, targetBlockId);
        if (t.kind === "format") return void applyFormatToExistingBlock(t.item, targetBlockId);
      }
      if (t.kind === "block" && !lesson?.blocks.some((b) => b.placeholder)) {
        addTrainingBlock(t.item);
        return;
      }
      setTarget(t);
    },
    [lesson, router],
  );
  const sheet = <AddSheet target={target} onClose={() => setTarget(null)} />;
  return { add, sheet };
}
