"use client";

import * as React from "react";
import { Copy, FilePlus2, LayoutTemplate } from "lucide-react";
import { useLibrary, useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { duplicateLesson, lessonFromTemplate, newLesson } from "@/lib/data/lesson-ops";
import { EMPTY_TEMPLATE_ID } from "@/data/seed";
import { formatDuration } from "@/lib/time/format";
import { lessonTotals } from "@/lib/time/structure";
import { Sheet } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";

/** Nieuwe les: leeg, vanuit een lesstructuur of door een bestaande les te dupliceren. */
export function NewLessonSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (id: string) => void }) {
  const lib = useLibrary();
  const lessons = useStore((s) => s.data.lessons);
  const prefs = useStore((s) => s.data.prefs);
  const create = useStore((s) => s.createLesson);
  const [mode, setMode] = React.useState<"structuur" | "dupliceren">("structuur");
  const list = React.useMemo(() => Object.values(lessons).filter((l) => !l.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [lessons]);
  const done = (id: string, msg: string) => {
    toast(msg);
    onOpenChange(false);
    onCreated?.(id);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Nieuwe les" size="md">
      <button
        type="button"
        onClick={() => {
          const empty = lib.template.get(EMPTY_TEMPLATE_ID);
          const id = create(empty ? lessonFromTemplate(empty, prefs) : newLesson(prefs), true);
          done(id, "Lege les aangemaakt");
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left hover:bg-subtle"
        data-testid="new-empty-lesson"
      >
        <FilePlus2 className="size-5 text-accent" />
        <span>
          <span className="block font-medium">Lege les</span>
          <span className="block text-[13px] text-muted">{Math.round(prefs.defaultTargetSec / 60)} min · {prefs.defaultParticipants} deelnemers · tweetallen</span>
        </span>
      </button>
      <Segmented
        className="mt-4"
        label="Startpunt"
        value={mode}
        onChange={setMode}
        options={[
          { id: "structuur", label: "Vanuit lesstructuur" },
          { id: "dupliceren", label: "Les dupliceren" },
        ]}
      />
      <ul className="mt-2 divide-y divide-line/70">
        {mode === "structuur" &&
          lib.templates
            .filter((t) => t.slots.length > 0)
            .map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 py-2.5 text-left"
                  onClick={() => done(create(lessonFromTemplate(t, prefs), true), `Les gestart vanuit ${t.name}`)}
                  data-testid="template-option"
                >
                  <LayoutTemplate className="mt-0.5 size-5 shrink-0 text-faint" />
                  <span className="min-w-0">
                    <span className="block font-medium">{t.name}</span>
                    <span className="block text-[13px] text-muted">{t.slots.map((s) => `${s.title} ${Math.round(s.durationSec / 60)}’`).join(" · ")}</span>
                  </span>
                </button>
              </li>
            ))}
        {mode === "dupliceren" &&
          list.map((l) => (
            <li key={l.id}>
              <button type="button" className="flex w-full items-start gap-3 py-2.5 text-left" onClick={() => done(create(duplicateLesson(l), true), "Les gedupliceerd")}>
                <Copy className="mt-0.5 size-5 shrink-0 text-faint" />
                <span className="min-w-0">
                  <span className="block font-medium">{l.title}</span>
                  <span className="block text-[13px] text-muted">{l.blocks.length} blokken · {formatDuration(lessonTotals(l).planned)}{l.date ? ` · ${l.date}` : ""}</span>
                </span>
              </button>
            </li>
          ))}
      </ul>
    </Sheet>
  );
}
