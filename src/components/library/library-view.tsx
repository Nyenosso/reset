"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, MoreHorizontal, Pencil, Plus, RotateCcw, Search, SlidersHorizontal, Sparkles, Star, Trash2, X } from "lucide-react";
import type { Exercise, Format, LessonTemplate, LibraryItem, LibraryKind, TrainingBlock } from "@/lib/domain/types";
import { EXERCISE_GROUPS, EXERCISE_CATEGORIES, FORMAT_SECTIONS, type ExerciseGroup } from "@/lib/domain/vocab";
import { useLibrary, useStore } from "@/lib/store";
import { useUi, type LibTab } from "@/lib/store/ui";
import { countActiveFilters, filterBlocks, filterExercises, filterFormats, searchItems } from "@/lib/data/search";
import { itemName } from "@/lib/data/library";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { SyncBadge } from "@/components/layout/sync-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Empty } from "@/components/ui/empty";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { IncrementalList } from "@/components/shared/incremental-list";
import { cn } from "@/components/ui/cn";
import { BlockCardLib, ExerciseCard, FormatCard, TemplateCard } from "./cards";
import { BlockDetail, ExerciseDetail, FormatDetail, TemplateDetail } from "./details";
import { BlockEditor, ExerciseEditor, FormatEditor, TemplateEditor, newExercise, newFormat, newTemplate, newTrainingBlock } from "./editors";
import { FiltersSheet } from "./filters-sheet";
import { useAddToLesson, type AddTarget } from "./add-sheet";
import { deleteLibraryItem } from "./actions";

const CAT_ORDER = Object.fromEntries(EXERCISE_CATEGORIES.map((c, i) => [c.id, i])) as Record<string, number>;
const SECTION_ORDER = Object.fromEntries(FORMAT_SECTIONS.map((s, i) => [s.id, i])) as Record<string, number>;
const TAB_KIND: Record<LibTab, LibraryKind> = { oefeningen: "exercise", formats: "format", blokken: "block", structuren: "template" };
const KIND_TAB: Record<LibraryKind, LibTab> = { exercise: "oefeningen", format: "formats", block: "blokken", template: "structuren" };
const NEW_LABEL: Record<LibTab, string> = { oefeningen: "Nieuwe oefening", formats: "Nieuw format", blokken: "Nieuw blok", structuren: "Nieuwe structuur" };

type Editing = { kind: "exercise"; item: Exercise } | { kind: "format"; item: Format } | { kind: "block"; item: TrainingBlock } | { kind: "template"; item: LessonTemplate } | null;

export function LibraryView() {
  const lib = useLibrary();
  const ui = useUi();
  const favorites = useStore((s) => s.data.favorites);
  const recent = useStore((s) => s.data.recent);
  const targetBlockId = useUi((s) => s.targetBlockId);
  const params = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Editing>(null);
  const [group, setGroup] = React.useState<ExerciseGroup | "all">("all");
  const { add, sheet } = useAddToLesson();

  const tab = ui.libTab;
  const query = ui.queries[tab];
  const favSet = React.useMemo(() => new Set(favorites), [favorites]);

  // Tab en detail uit de URL (?tab=formats&item=format:fmt-emom).
  React.useEffect(() => {
    const t = params.get("tab") as LibTab | null;
    if (t && t !== ui.libTab && TAB_KIND[t]) ui.setLibTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const itemParam = params.get("item");
  const detail = React.useMemo(() => {
    if (!itemParam) return null;
    const [kind, ...rest] = itemParam.split(":");
    const id = rest.join(":");
    const item = (lib[kind as LibraryKind] as Map<string, LibraryItem> | undefined)?.get(id);
    return item ? { kind: kind as LibraryKind, item } : null;
  }, [itemParam, lib]);

  const setParam = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `/bibliotheek/?${qs}` : "/bibliotheek/", { scroll: false });
  };
  const openDetail = (kind: LibraryKind, id: string) => setParam({ item: `${kind}:${id}` });
  const closeDetail = () => setParam({ item: null });

  const results = React.useMemo(() => {
    const fav = ui.favOnly[tab];
    const kind = TAB_KIND[tab];
    const onlyFav = <T extends { id: string }>(list: T[]) => (fav ? list.filter((x) => favSet.has(`${kind}:${x.id}`)) : list);
    if (tab === "oefeningen") {
      const groupCats = group === "all" ? undefined : EXERCISE_CATEGORIES.filter((c) => c.group === group).map((c) => c.id);
      const f = { ...ui.exerciseFilters, categories: ui.exerciseFilters.categories?.length ? ui.exerciseFilters.categories : groupCats };
      const list = onlyFav(filterExercises(lib.exercises, f));
      return query.trim() ? searchItems(list, query) : [...list].sort((a, b) => CAT_ORDER[a.category] - CAT_ORDER[b.category]);
    }
    if (tab === "formats") {
      const list = onlyFav(filterFormats(lib.formats, ui.formatFilters));
      return query.trim() ? searchItems(list, query) : [...list].sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section]);
    }
    if (tab === "blokken") return searchItems(onlyFav(filterBlocks(lib.blocks, ui.blockFilters)), query);
    return searchItems(onlyFav(lib.templates), query);
  }, [tab, lib, ui.favOnly, ui.exerciseFilters, ui.formatFilters, ui.blockFilters, query, favSet, group]);

  // Treffers in andere tabs als deze tab leeg is.
  const elsewhere = React.useMemo(() => {
    if (!query.trim() || results.length > 0) return [];
    const counts: { tab: LibTab; n: number }[] = [];
    if (tab !== "oefeningen") counts.push({ tab: "oefeningen", n: searchItems(lib.exercises, query).length });
    if (tab !== "formats") counts.push({ tab: "formats", n: searchItems(lib.formats, query).length });
    if (tab !== "blokken") counts.push({ tab: "blokken", n: searchItems(lib.blocks, query).length });
    return counts.filter((c) => c.n > 0);
  }, [query, results.length, tab, lib]);

  const activeFilters = tab === "oefeningen" ? countActiveFilters(ui.exerciseFilters) : tab === "formats" ? countActiveFilters(ui.formatFilters) : tab === "blokken" ? countActiveFilters(ui.blockFilters) : 0;
  const kind = TAB_KIND[tab];
  const recentItems = React.useMemo(() => {
    if (query || activeFilters || ui.favOnly[tab]) return [];
    return recent.filter((r) => r.kind === kind).slice(0, 4).map((r) => (lib[kind] as Map<string, LibraryItem>).get(r.id)).filter(Boolean) as LibraryItem[];
  }, [recent, kind, lib, query, activeFilters, ui.favOnly, tab]);

  const onAdd = (t: AddTarget) => add(t, targetBlockId);

  const newItem = () => {
    if (tab === "oefeningen") setEditing({ kind: "exercise", item: newExercise() });
    if (tab === "formats") setEditing({ kind: "format", item: newFormat() });
    if (tab === "blokken") setEditing({ kind: "block", item: newTrainingBlock() });
    if (tab === "structuren") setEditing({ kind: "template", item: newTemplate() });
  };

  const renderItem = (item: LibraryItem) => {
    const modified = lib.modified.has(`${item.kind}:${item.id}`);
    switch (item.kind) {
      case "exercise":
        return <ExerciseCard e={item} modified={modified} onOpen={() => openDetail("exercise", item.id)} onAdd={() => onAdd({ kind: "exercise", item })} />;
      case "format":
        return <FormatCard f={item} modified={modified} onOpen={() => openDetail("format", item.id)} onAdd={() => onAdd({ kind: "format", item })} />;
      case "block":
        return <BlockCardLib b={item} modified={modified} onOpen={() => openDetail("block", item.id)} onAdd={() => onAdd({ kind: "block", item })} />;
      case "template":
        return <TemplateCard t={item} onOpen={() => openDetail("template", item.id)} onAdd={() => onAdd({ kind: "template", item })} />;
    }
  };

  return (
    <>
      <PageHeader
        title="Bibliotheek"
        actions={
          <>
            <span className="md:hidden"><SyncBadge /></span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/formatkiezer/">
                <Sparkles className="text-accent" /> <span className="hidden sm:inline">Formatkiezer</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label={NEW_LABEL[tab]} onClick={newItem} data-testid="new-item">
              <Plus />
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
            <Input
              type="search"
              value={query}
              onChange={(e) => ui.setQuery(tab, e.target.value)}
              placeholder="Zoek oefeningen of formats…"
              aria-label="Zoeken in de bibliotheek"
              className="pl-10 pr-9"
              enterKeyHint="search"
            />
            {query && (
              <button type="button" aria-label="Zoekopdracht wissen" onClick={() => ui.setQuery(tab, "")} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-faint">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button size="icon" variant="secondary" aria-label="Filters" onClick={() => setFiltersOpen(true)} className="relative">
            <SlidersHorizontal />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{activeFilters}</span>}
          </Button>
          <Button size="icon" variant={ui.favOnly[tab] ? "soft" : "secondary"} aria-pressed={ui.favOnly[tab]} aria-label="Alleen favorieten" onClick={() => ui.toggleFavOnly(tab)}>
            <Star className={cn(ui.favOnly[tab] && "fill-current")} />
          </Button>
        </div>
        <Segmented
          className="mt-2"
          label="Soort bibliotheekitem"
          value={tab}
          onChange={(t) => ui.setLibTab(t)}
          options={[
            { id: "oefeningen", label: "Oefeningen" },
            { id: "formats", label: "Formats" },
            { id: "blokken", label: "Blokken" },
            { id: "structuren", label: "Structuren" },
          ]}
        />
      </PageHeader>

      <PageBody>
        {tab === "oefeningen" && !ui.exerciseFilters.categories?.length && (
          <div className="-mx-4 mb-1 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
            <Chip size="sm" selected={group === "all"} onClick={() => setGroup("all")}>Alle</Chip>
            {EXERCISE_GROUPS.map((g) => (
              <Chip size="sm" key={g.id} selected={group === g.id} onClick={() => setGroup(group === g.id ? "all" : g.id)}>
                {g.label}
              </Chip>
            ))}
          </div>
        )}
        {tab === "formats" && !ui.formatFilters.sections?.length && (
          <div className="-mx-4 mb-1 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
            {FORMAT_SECTIONS.map((s) => (
              <Chip size="sm" key={s.id} onClick={() => ui.setFormatFilters({ ...ui.formatFilters, sections: [s.id] })}>
                {s.label}
              </Chip>
            ))}
          </div>
        )}
        <ActiveFilterChips tab={tab} />

        {targetBlockId && (tab === "oefeningen" || tab === "formats") && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-[14px] text-accent-strong">
            <span>Tik + om toe te voegen aan het gekozen blok</span>
            <button type="button" className="font-semibold" onClick={() => ui.setTargetBlock(undefined)}>Stoppen</button>
          </div>
        )}

        {recentItems.length > 0 && (
          <div className="mb-2">
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-faint">Recent gebruikt</p>
            <ul className="mb-3 rounded-xl border border-line bg-surface px-1">
              {recentItems.map((it) => (
                <li key={`r-${it.id}`}>{renderItem(it)}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mb-1 text-[12px] text-faint tabular" aria-live="polite" data-testid="result-count">
          {results.length} {results.length === 1 ? "resultaat" : "resultaten"}
        </p>
        {results.length === 0 ? (
          <Empty icon={<Search />} title="Niets gevonden" action={activeFilters ? <Button variant="secondary" onClick={() => { ui.setExerciseFilters({}); ui.setFormatFilters({}); ui.setBlockFilters({}); }}>Filters wissen</Button> : undefined}>
            {elsewhere.length > 0 ? (
              <span className="flex flex-col items-center gap-1">
                Wel gevonden in:
                {elsewhere.map((e) => (
                  <button key={e.tab} type="button" className="font-medium text-accent" onClick={() => { ui.setQuery(e.tab, query); ui.setLibTab(e.tab); }}>
                    {e.tab === "oefeningen" ? "Oefeningen" : e.tab === "formats" ? "Formats" : "Blokken"} ({e.n})
                  </button>
                ))}
              </span>
            ) : (
              "Probeer een andere zoekterm of minder filters."
            )}
          </Empty>
        ) : (
          <IncrementalList items={results as LibraryItem[]} getKey={(x) => x.id} render={(x) => renderItem(x)} className="rounded-xl border border-line bg-surface px-1" />
        )}
      </PageBody>

      <FiltersSheet tab={tab} open={filtersOpen} onOpenChange={setFiltersOpen} />
      {sheet}
      <DetailSheet
        detail={detail}
        onClose={closeDetail}
        onAdd={(t) => {
          closeDetail();
          onAdd(t);
        }}
        onEdit={(e) => setEditing(e)}
        modified={detail ? lib.modified.has(`${detail.kind}:${detail.item.id}`) : false}
      />
      {editing?.kind === "exercise" && <ExerciseEditor key={editing.item.id} open onOpenChange={(v) => !v && setEditing(null)} initial={editing.item} />}
      {editing?.kind === "format" && <FormatEditor key={editing.item.id} open onOpenChange={(v) => !v && setEditing(null)} initial={editing.item} />}
      {editing?.kind === "block" && <BlockEditor key={editing.item.id} open onOpenChange={(v) => !v && setEditing(null)} initial={editing.item} />}
      {editing?.kind === "template" && <TemplateEditor key={editing.item.id} open onOpenChange={(v) => !v && setEditing(null)} initial={editing.item} />}
    </>
  );
}

function ActiveFilterChips({ tab }: { tab: LibTab }) {
  const ui = useUi();
  const f = tab === "oefeningen" ? ui.exerciseFilters : tab === "formats" ? ui.formatFilters : tab === "blokken" ? ui.blockFilters : {};
  const n = countActiveFilters(f);
  if (!n) return null;
  const clear = () => (tab === "oefeningen" ? ui.setExerciseFilters({}) : tab === "formats" ? ui.setFormatFilters({}) : ui.setBlockFilters({}));
  return (
    <div className="mb-2 flex items-center gap-2 text-[13px] text-muted">
      <span>{n} {n === 1 ? "filter" : "filters"} actief</span>
      <button type="button" onClick={clear} className="font-medium text-accent">Wissen</button>
    </div>
  );
}

function DetailSheet({ detail, onClose, onAdd, onEdit, modified }: { detail: { kind: LibraryKind; item: LibraryItem } | null; onClose: () => void; onAdd: (t: AddTarget) => void; onEdit: (e: NonNullable<Editing>) => void; modified: boolean }) {
  const toggleFav = useStore((s) => s.toggleFavorite);
  const favs = useStore((s) => s.data.favorites);
  const duplicate = useStore((s) => s.duplicateItem);
  const reset = useStore((s) => s.resetItem);
  if (!detail) return null;
  const { kind, item } = detail;
  const fav = favs.includes(`${kind}:${item.id}`);
  const target = { kind, item } as AddTarget;
  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={itemName(item)}
      size="lg"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" aria-label={fav ? "Uit favorieten" : "Favoriet"} aria-pressed={fav} onClick={() => toggleFav(kind, item.id)}>
            <Star className={cn(fav && "fill-[#e8a33d] text-[#d48a1c]")} />
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Meer acties">
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent align="start">
              <MenuItem icon={<Pencil />} onSelect={() => { onClose(); onEdit({ kind, item } as NonNullable<Editing>); }}>Bewerken</MenuItem>
              <MenuItem icon={<Copy />} onSelect={() => { const copy = duplicate(kind, item.id); onClose(); if (copy) onEdit({ kind, item: copy } as NonNullable<Editing>); }}>
                {kind === "format" ? "Nieuw format op basis hiervan" : "Dupliceren"}
              </MenuItem>
              {modified && <MenuItem icon={<RotateCcw />} onSelect={() => reset(kind, item.id)}>Origineel herstellen</MenuItem>}
              <MenuSeparator />
              <MenuItem icon={<Trash2 />} danger onSelect={() => { onClose(); deleteLibraryItem(kind, item.id); }}>
                {item.builtin ? "Verbergen" : "Verwijderen"}
              </MenuItem>
            </MenuContent>
          </Menu>
          <Button variant="primary" className="flex-1" onClick={() => onAdd(target)} data-testid="detail-add">
            <Plus /> {kind === "template" ? "Start les met deze structuur" : "Voeg toe aan les"}
          </Button>
        </div>
      }
    >
      {kind === "exercise" && <ExerciseDetail e={item as Exercise} />}
      {kind === "format" && <FormatDetail f={item as Format} />}
      {kind === "block" && <BlockDetail b={item as TrainingBlock} />}
      {kind === "template" && <TemplateDetail t={item as LessonTemplate} />}
      {modified && <p className="mt-4 text-xs text-accent">Je hebt dit ingebouwde item aangepast. ‘Origineel herstellen’ zet het terug.</p>}
    </Sheet>
  );
}

export { KIND_TAB };
