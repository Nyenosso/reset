"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import type { Exercise } from "@/lib/domain/types";
import { useLibrary, useStore } from "@/lib/store";
import { searchItems } from "@/lib/data/search";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { IncrementalList } from "./incremental-list";
import { exerciseMeta } from "@/components/library/cards";

/** Zoek en kies een oefening (voor blokken en formats). Ondersteunt ook vrije tekst. */
export function ExercisePicker({ open, onOpenChange, onPick, onPickText, title = "Oefening toevoegen" }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (e: Exercise) => void; onPickText?: (text: string) => void; title?: string }) {
  const lib = useLibrary();
  const favorites = useStore((s) => s.data.favorites);
  const [q, setQ] = React.useState("");
  const favSet = React.useMemo(() => new Set(favorites), [favorites]);
  const results = React.useMemo(() => {
    const list = searchItems(lib.exercises, q);
    if (q) return list;
    return [...list.filter((e) => favSet.has(`exercise:${e.id}`)), ...list.filter((e) => !favSet.has(`exercise:${e.id}`))];
  }, [lib.exercises, q, favSet]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} size="md">
      <div className="sticky top-0 z-10 -mx-4 bg-surface px-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek oefening, bv. lowkick of 1-2-3" className="pl-10" aria-label="Zoek oefening" />
        </div>
        {onPickText && q.trim() && (
          <button type="button" onClick={() => { onPickText(q.trim()); setQ(""); }} className="mt-2 flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-[15px] text-accent hover:bg-accent-soft">
            <Plus className="size-5" /> ‘{q.trim()}’ als vrije tekst toevoegen
          </button>
        )}
      </div>
      <IncrementalList
        items={results}
        getKey={(e) => e.id}
        className="divide-y divide-line/70"
        render={(e) => (
          <button type="button" onClick={() => onPick(e)} className="flex w-full items-center gap-2 py-2.5 text-left">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{e.name}</span>
              <span className="block truncate text-[13px] text-muted">{exerciseMeta(e)}</span>
            </span>
            <Plus className="size-5 shrink-0 text-accent" />
          </button>
        )}
      />
    </Sheet>
  );
}
