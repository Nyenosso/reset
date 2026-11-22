"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, Copy, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Star, Timer, Trash2, CalendarDays } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { equipmentLabel, goalLabel, statusLabel } from "@/lib/domain/vocab";
import { formatDuration } from "@/lib/time/format";
import { lessonTotals } from "@/lib/time/structure";
import { normalizeSearch, searchTokens } from "@/lib/utils/text";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { SyncBadge } from "@/components/layout/sync-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Tag } from "@/components/ui/chip";
import { Empty } from "@/components/ui/empty";
import { Confirm } from "@/components/ui/confirm";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { cn } from "@/components/ui/cn";
import { NewLessonSheet } from "@/components/lesson/new-lesson-sheet";
import { GivenSheet } from "./given-sheet";

type Filter = "alle" | "gepland" | "gegeven" | "favorieten" | "concept" | "prullenbak";

function haystack(l: Lesson): string {
  const mins = Math.round(lessonTotals(l).planned / 60);
  return normalizeSearch(
    [
      l.title, l.audience, l.notes, l.templateName ?? "", l.date ?? "", statusLabel(l.status), `${mins} min`, `${mins}min`,
      ...l.goals.map(goalLabel), ...l.equipment.map(equipmentLabel),
      ...l.blocks.flatMap((b) => [b.title, b.formatName ?? "", ...b.exercises.map((e) => e.name), ...b.equipment.map(equipmentLabel)]),
    ].join(" | "),
  );
}

export function LessonsView() {
  const lessons = useStore((s) => s.data.lessons);
  const activeId = useStore((s) => s.data.prefs.activeLessonId);
  const [filter, setFilter] = React.useState<Filter>("alle");
  const [q, setQ] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(false);
  const [given, setGiven] = React.useState<Lesson | null>(null);
  const [purge, setPurge] = React.useState<Lesson | null>(null);
  const router = useRouter();

  const all = React.useMemo(() => Object.values(lessons), [lessons]);
  const counts = React.useMemo(() => {
    const live = all.filter((l) => !l.deletedAt);
    return {
      alle: live.length,
      gepland: live.filter((l) => l.status === "gepland").length,
      gegeven: live.filter((l) => l.status === "gegeven").length,
      favorieten: live.filter((l) => l.favorite).length,
      concept: live.filter((l) => l.status === "concept").length,
      prullenbak: all.filter((l) => l.deletedAt).length,
    };
  }, [all]);

  const list = React.useMemo(() => {
    const tokens = searchTokens(q);
    return all
      .filter((l) => (filter === "prullenbak" ? Boolean(l.deletedAt) : !l.deletedAt))
      .filter((l) => filter === "alle" || filter === "prullenbak" || (filter === "favorieten" ? l.favorite : l.status === filter))
      .filter((l) => !tokens.length || tokens.every((t) => haystack(l).includes(t)))
      .sort((a, b) => {
        if (filter === "gepland") return (a.date ?? "9999").localeCompare(b.date ?? "9999");
        if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [all, filter, q]);

  const st = useStore.getState();
  const open = (id: string) => {
    st.setActiveLesson(id);
    router.push("/lesmaker/");
  };

  return (
    <>
      <PageHeader
        title="Mijn lessen"
        actions={
          <>
            <SyncBadge />
            <Button variant="primary" size="sm" onClick={() => setNewOpen(true)} data-testid="lessons-new">
              <Plus /> Nieuwe les
            </Button>
          </>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op naam, oefening, format, doel, datum…" className="pl-10" aria-label="Lessen zoeken" />
        </div>
        <Segmented
          className="mt-2"
          label="Filter lessen"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "alle", label: "Alle", count: counts.alle },
            { id: "gepland", label: "Gepland", count: counts.gepland },
            { id: "gegeven", label: "Gegeven", count: counts.gegeven },
            { id: "favorieten", label: "Favoriet", count: counts.favorieten },
            { id: "concept", label: "Concept", count: counts.concept },
            { id: "prullenbak", label: "Prullenbak", count: counts.prullenbak },
          ]}
        />
      </PageHeader>
      <PageBody>
        {list.length === 0 ? (
          <Empty icon={<CalendarDays />} title={filter === "prullenbak" ? "Prullenbak is leeg" : "Geen lessen gevonden"} action={filter !== "prullenbak" ? <Button variant="primary" onClick={() => setNewOpen(true)}>Nieuwe les</Button> : undefined}>
            {q ? "Probeer een andere zoekterm." : undefined}
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="lesson-list">
            {list.map((l) => {
              const t = lessonTotals(l);
              const trash = Boolean(l.deletedAt);
              return (
                <li key={l.id} className={cn("flex items-stretch rounded-xl border bg-surface", l.id === activeId ? "border-accent/50" : "border-line")} data-testid="lesson-card">
                  <button type="button" disabled={trash} onClick={() => open(l.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left disabled:cursor-default">
                    <p className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold">{l.title}</span>
                      {l.id === activeId && !trash && <Tag tone="accent">Actief</Tag>}
                    </p>
                    <p className="text-[13px] text-muted tabular">
                      {formatDuration(t.planned)} · {l.participants} deelnemers{l.date ? ` · ${new Date(`${l.date}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                    <p className="truncate text-[13px] text-faint">
                      {l.blocks.length} blokken{l.goals.length ? ` · ${l.goals.slice(0, 2).map(goalLabel).join(" / ")}` : ""} · {statusLabel(l.status)}
                      {l.evaluation?.rating ? ` · ${l.evaluation.rating}/5` : ""}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center pr-1">
                    {!trash && (
                      <button type="button" aria-label={l.favorite ? "Uit favorieten" : "Favoriet"} aria-pressed={l.favorite} onClick={() => st.updateLesson(l.id, (x) => ({ ...x, favorite: !x.favorite }))} className="grid size-11 place-items-center rounded-full text-faint hover:bg-subtle">
                        <Star className={cn("size-[18px]", l.favorite && "fill-[#e8a33d] text-[#d48a1c]")} />
                      </button>
                    )}
                    <Menu>
                      <MenuTrigger asChild>
                        <button type="button" aria-label={`Acties voor ${l.title}`} className="grid size-11 place-items-center rounded-full text-faint hover:bg-subtle" data-testid="lesson-card-menu">
                          <MoreHorizontal className="size-5" />
                        </button>
                      </MenuTrigger>
                      <MenuContent>
                        {trash ? (
                          <>
                            <MenuItem icon={<RotateCcw />} onSelect={() => { st.restoreLesson(l.id); toast("Les hersteld"); }}>Herstellen</MenuItem>
                            <MenuItem icon={<Trash2 />} danger onSelect={() => setPurge(l)}>Definitief verwijderen</MenuItem>
                          </>
                        ) : (
                          <>
                            <MenuItem icon={<Pencil />} onSelect={() => open(l.id)}>Openen en bewerken</MenuItem>
                            <MenuItem icon={<Copy />} onSelect={() => { st.duplicateLessonById(l.id); toast("Les gedupliceerd"); router.push("/lesmaker/"); }}>Dupliceren</MenuItem>
                            <MenuItem icon={<Timer />} onSelect={() => router.push(`/coach/?les=${l.id}`)}>Coachmodus</MenuItem>
                            <MenuItem icon={<CalendarCheck2 />} onSelect={() => setGiven(l)}>Markeer als gegeven</MenuItem>
                            <MenuSeparator />
                            <MenuItem icon={<Trash2 />} danger onSelect={() => { const r = st.deleteLesson(l.id); if (r) toast("Les naar de prullenbak", { actionLabel: "Ongedaan maken", onAction: r.restore }); }}>Verwijderen</MenuItem>
                          </>
                        )}
                      </MenuContent>
                    </Menu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
      <NewLessonSheet open={newOpen} onOpenChange={setNewOpen} onCreated={() => router.push("/lesmaker/")} />
      {given && <GivenSheet lesson={given} open onOpenChange={(v) => !v && setGiven(null)} />}
      <Confirm
        open={purge !== null}
        onOpenChange={(v) => !v && setPurge(null)}
        title="Definitief verwijderen?"
        description={`‘${purge?.title ?? ""}’ wordt permanent verwijderd en kan niet worden hersteld.`}
        onConfirm={() => {
          if (purge) st.purgeLesson(purge.id);
          setPurge(null);
        }}
      />
    </>
  );
}
