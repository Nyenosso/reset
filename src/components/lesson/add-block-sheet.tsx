"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Sparkles, SquareDashed } from "lucide-react";
import type { Exercise, Format, LibraryItem, TrainingBlock } from "@/lib/domain/types";
import { goalLabel, phaseLabel } from "@/lib/domain/vocab";
import { formatDuration, formatRange } from "@/lib/time/format";
import { blockSeconds } from "@/lib/time/structure";
import { useLibrary, useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { searchItems } from "@/lib/data/search";
import {
  addExerciseToBlock,
  applyFormatToBlock,
  blockFromExercise,
  blockFromFormat,
  blockFromTraining,
  emptyBlock,
  fillWithTraining,
} from "@/lib/data/lesson-ops";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { IncrementalList } from "@/components/shared/incremental-list";
import { exerciseMeta } from "@/components/library/cards";

type Tab = "blokken" | "formats" | "oefeningen" | "favorieten" | "recent";

/** Compacte picker om blokken, formats of oefeningen aan de les toe te voegen (of een tijdslot te vullen). */
export function AddBlockSheet({ open, onOpenChange, lessonId, fillSlotId }: { open: boolean; onOpenChange: (v: boolean) => void; lessonId: string; fillSlotId?: string }) {
  const lib = useLibrary();
  const favorites = useStore((s) => s.data.favorites);
  const recent = useStore((s) => s.data.recent);
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("blokken");
  const [q, setQ] = React.useState("");
  const slot = useStore((s) => (fillSlotId ? s.data.lessons[lessonId]?.blocks.find((b) => b.id === fillSlotId) : undefined));

  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQ("");
  }

  const items: LibraryItem[] = React.useMemo(() => {
    const lookup = (key: string): LibraryItem | undefined => {
      const [kind, ...rest] = key.split(":");
      const id = rest.join(":");
      if (kind === "exercise") return lib.exercise.get(id);
      if (kind === "format") return lib.format.get(id);
      if (kind === "block") return lib.block.get(id);
      return undefined;
    };
    let list: LibraryItem[];
    if (tab === "blokken") list = lib.blocks;
    else if (tab === "formats") list = lib.formats;
    else if (tab === "oefeningen") list = lib.exercises;
    else if (tab === "favorieten") list = favorites.map(lookup).filter(Boolean) as LibraryItem[];
    else list = recent.map((r) => lookup(`${r.kind}:${r.id}`)).filter(Boolean) as LibraryItem[];
    let result = searchItems(list as (Exercise | Format | TrainingBlock)[], q) as LibraryItem[];
    if (slot && tab === "blokken" && !q) result = [...result.filter((b) => b.kind === "block" && b.phase === slot.phase), ...result.filter((b) => !(b.kind === "block" && b.phase === slot.phase))];
    return result;
  }, [tab, lib, favorites, recent, q, slot]);

  function pick(item: LibraryItem) {
    const st = useStore.getState();
    if (item.kind === "template") return;
    st.touchRecent(item.kind, item.id);
    if (fillSlotId && slot) {
      const before = slot;
      st.updateBlock(lessonId, fillSlotId, (b) =>
        item.kind === "block" ? fillWithTraining(b, item) : item.kind === "format" ? { ...applyFormatToBlock(b, item), title: b.title } : { ...addExerciseToBlock(b, item), placeholder: false },
      );
      toast("Tijdslot ingevuld", { actionLabel: "Ongedaan maken", onAction: () => st.updateBlock(lessonId, fillSlotId, () => before) });
      onOpenChange(false);
      if (item.kind !== "block") router.push(`/lesmaker/?blok=${fillSlotId}`);
      return;
    }
    const block = item.kind === "block" ? blockFromTraining(item) : item.kind === "format" ? blockFromFormat(item) : blockFromExercise(item);
    st.addBlocks(lessonId, [block]);
    toast(`${block.title} toegevoegd`, { actionLabel: "Ongedaan maken", onAction: () => st.removeBlock(lessonId, block.id) });
    onOpenChange(false);
    if (item.kind === "format") router.push(`/lesmaker/?blok=${block.id}`);
  }

  function addEmpty() {
    const st = useStore.getState();
    const block = emptyBlock("bag-basics", "Nieuw blok", 300);
    st.addBlocks(lessonId, [block]);
    onOpenChange(false);
    router.push(`/lesmaker/?blok=${block.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={slot ? `${slot.title} invullen` : "Blok toevoegen"} description={slot ? `${phaseLabel(slot.phase)} · ${formatDuration(slot.durationSec)}` : undefined} size="md">
      <div className="sticky top-0 z-10 -mx-4 bg-surface px-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoeken" className="pl-10" aria-label="Zoek blok, format of oefening" />
        </div>
        <Segmented
          className="mt-2"
          label="Bron"
          value={tab}
          onChange={setTab}
          options={[
            { id: "blokken", label: "Blokken" },
            { id: "formats", label: "Formats" },
            { id: "oefeningen", label: "Oefeningen" },
            { id: "favorieten", label: "★" },
            { id: "recent", label: "Recent" },
          ]}
        />
        {!slot && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={addEmpty} data-testid="add-empty-block">
              <SquareDashed /> Leeg blok
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/formatkiezer/">
                <Sparkles className="text-accent" /> Formatkiezer
              </Link>
            </Button>
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">{tab === "favorieten" ? "Nog geen favorieten. Tik op het sterretje in de bibliotheek." : tab === "recent" ? "Nog niets recent gebruikt." : "Niets gevonden."}</p>
      ) : (
        <IncrementalList
          items={items}
          getKey={(x) => `${x.kind}:${x.id}`}
          className="divide-y divide-line/70"
          render={(item) => (
            <button type="button" onClick={() => pick(item)} className="flex w-full items-center gap-2 py-2.5 text-left" data-testid="picker-item">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{"name" in item ? item.name : item.title}</span>
                <span className="block truncate text-[13px] text-muted">
                  {item.kind === "block"
                    ? `${phaseLabel(item.phase)} · ${formatDuration(blockSeconds(item))}${item.formatName ? ` · ${item.formatName}` : ""}`
                    : item.kind === "format"
                      ? `Format · ${goalLabel(item.mainGoal)} · ${formatRange(item.durationSec)}`
                      : item.kind === "exercise"
                        ? `Oefening · ${exerciseMeta(item)}`
                        : ""}
                </span>
              </span>
              <Plus className="size-5 shrink-0 text-accent" />
            </button>
          )}
        />
      )}
    </Sheet>
  );
}
