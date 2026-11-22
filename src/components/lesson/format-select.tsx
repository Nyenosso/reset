"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Format } from "@/lib/domain/types";
import { goalLabel } from "@/lib/domain/vocab";
import { formatRange } from "@/lib/time/format";
import { useLibrary } from "@/lib/store";
import { searchItems } from "@/lib/data/search";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { IncrementalList } from "@/components/shared/incremental-list";

export function FormatSelect({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (f: Format) => void }) {
  const lib = useLibrary();
  const [q, setQ] = React.useState("");
  const list = React.useMemo(() => searchItems(lib.formats, q), [lib.formats, q]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Format kiezen" description="De werkstructuur van het blok wordt vervangen; oefeningen blijven staan.">
      <div className="sticky top-0 z-10 -mx-4 bg-surface px-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek format" className="pl-10" aria-label="Zoek format" />
        </div>
      </div>
      <IncrementalList
        items={list}
        getKey={(f) => f.id}
        className="divide-y divide-line/70"
        render={(f) => (
          <button type="button" onClick={() => onPick(f)} className="w-full py-2.5 text-left">
            <span className="block font-medium">{f.name}</span>
            <span className="block truncate text-[13px] text-muted">{goalLabel(f.mainGoal)} · {formatRange(f.durationSec)} · {f.description}</span>
          </button>
        )}
      />
    </Sheet>
  );
}
