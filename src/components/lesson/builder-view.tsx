"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BookmarkPlus,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FilePlus2,
  MoreHorizontal,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import type { Lesson, LessonBlock } from "@/lib/domain/types";
import { useActiveLesson, useStore } from "@/lib/store";
import { toast, useUi } from "@/lib/store/ui";
import { formatDuration } from "@/lib/time/format";
import { blockSeconds, lessonTotals } from "@/lib/time/structure";
import { lessonBlockToTraining } from "@/lib/data/lesson-ops";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { SyncBadge } from "@/components/layout/sync-badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Empty } from "@/components/ui/empty";
import { GivenSheet } from "@/components/lessons/given-sheet";
import { AddBlockButton, LessonBoard } from "./lesson-board";
import { AddBlockSheet } from "./add-block-sheet";
import { BlockForm } from "./block-form";
import { ChecksPanel } from "./checks-panel";
import { ExportSheet } from "./export-sheet";
import { LessonMeta } from "./lesson-meta";
import { NewLessonSheet } from "./new-lesson-sheet";
import { TimeBar } from "./time-bar";

export function BuilderView() {
  const params = useSearchParams();
  const router = useRouter();
  const lessons = useStore((s) => s.data.lessons);
  const setActive = useStore((s) => s.setActiveLesson);
  const lesson = useActiveLesson();
  const lesParam = params.get("les");
  const blokParam = params.get("blok");

  React.useEffect(() => {
    if (lesParam && lessons[lesParam] && !lessons[lesParam].deletedAt) {
      setActive(lesParam);
      router.replace(blokParam ? `/lesmaker/?blok=${blokParam}` : "/lesmaker/", { scroll: false });
    }
  }, [lesParam, blokParam, lessons, setActive, router]);

  if (!lesson) return <StartScreen />;
  const block = blokParam ? lesson.blocks.find((b) => b.id === blokParam) : undefined;
  if (blokParam && block) return <BlockPage lesson={lesson} block={block} />;
  return <Workspace lesson={lesson} />;
}

function StartScreen() {
  const [open, setOpen] = React.useState(false);
  const lessons = useStore((s) => s.data.lessons);
  const setActive = useStore((s) => s.setActiveLesson);
  const recent = React.useMemo(() => Object.values(lessons).filter((l) => !l.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6), [lessons]);
  return (
    <>
      <PageHeader title="Lesmaker" actions={<SyncBadge />} />
      <PageBody>
        <Empty icon={<FilePlus2 />} title="Geen les geopend" action={<Button variant="primary" size="lg" onClick={() => setOpen(true)} data-testid="new-lesson">Nieuwe les</Button>}>
          Start leeg, vanuit een lesstructuur, of dupliceer een les.
        </Empty>
        {recent.length > 0 && (
          <>
            <h2 className="mb-2 mt-2 text-[13px] font-semibold uppercase tracking-wide text-faint">Verder werken aan</h2>
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {recent.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setActive(l.id)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{l.title}</span>
                      <span className="block text-[13px] text-muted">{l.blocks.length} blokken · {formatDuration(lessonTotals(l).planned)}</span>
                    </span>
                    <ChevronRight className="size-5 text-faint" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </PageBody>
      <NewLessonSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

function Workspace({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const st = useStore.getState();
  const [addOpen, setAddOpen] = React.useState(false);
  const [fillSlot, setFillSlot] = React.useState<string | undefined>();
  const [newOpen, setNewOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [givenOpen, setGivenOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<string | undefined>();
  const setTarget = useUi((s) => s.setTargetBlock);

  React.useEffect(() => {
    setTarget(undefined);
  }, [setTarget]);

  const focusBlock = (id: string) => {
    setHighlight(id);
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlight(undefined), 1800);
  };

  return (
    <>
      <PageHeader
        title="Lesmaker"
        wide
        actions={
          <>
            <SyncBadge />
            <Button asChild variant="ghost" size="icon" aria-label="Coachmodus">
              <Link href={`/coach/?les=${lesson.id}`}>
                <Timer />
              </Link>
            </Button>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Lesacties" data-testid="lesson-menu">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem icon={<FilePlus2 />} onSelect={() => setNewOpen(true)}>Nieuwe les</MenuItem>
                <MenuItem icon={<ArrowLeftRight />} onSelect={() => router.push("/lessen/")}>Andere les openen</MenuItem>
                <MenuItem icon={<Copy />} onSelect={() => { st.duplicateLessonById(lesson.id); toast("Les gedupliceerd; je werkt nu in de kopie"); }}>Les dupliceren</MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Download />} onSelect={() => setExportOpen(true)}>Exporteren / kopiëren</MenuItem>
                <MenuItem icon={<Timer />} onSelect={() => router.push(`/coach/?les=${lesson.id}`)}>Coachmodus</MenuItem>
                <MenuItem icon={<CalendarCheck2 />} onSelect={() => setGivenOpen(true)}>Markeer als gegeven</MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} danger onSelect={() => { const r = st.deleteLesson(lesson.id); if (r) toast("Les naar de prullenbak", { actionLabel: "Ongedaan maken", onAction: () => { r.restore(); st.setActiveLesson(lesson.id); } }); }}>
                  Verwijderen
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />
      <PageBody wide>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <div className="flex flex-col gap-3">
            <LessonMeta lesson={lesson} />
            <TimeBar lesson={lesson} />
            <ChecksPanel lesson={lesson} onFocusBlock={focusBlock} />
          </div>
        </div>
        <div className="mt-3">
          {lesson.blocks.length === 0 ? (
            <Empty title="Nog geen blokken" action={<Button asChild variant="secondary"><Link href="/formatkiezer/"><Sparkles className="text-accent" /> Inspiratie in de formatkiezer</Link></Button>}>
              Voeg een blok toe of sleep er een vanuit de bibliotheek (desktop).
            </Empty>
          ) : (
            <LessonBoard
              lesson={lesson}
              highlight={highlight}
              onOpenBlock={(id) => router.push(`/lesmaker/?blok=${id}`)}
              onFill={(id) => {
                setFillSlot(id);
                setAddOpen(true);
              }}
            />
          )}
        </div>
        <div className="h-16 md:hidden" aria-hidden />
        <div className="mt-4 hidden md:block lg:max-w-[calc(100%-344px)]">
          <AddBlockButton onClick={() => { setFillSlot(undefined); setAddOpen(true); }} />
        </div>
      </PageBody>

      <div className="no-print fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-bg/95 px-4 py-2 backdrop-blur-sm md:hidden">
        <AddBlockButton onClick={() => { setFillSlot(undefined); setAddOpen(true); }} />
      </div>

      <AddBlockSheet open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setFillSlot(undefined); }} lessonId={lesson.id} fillSlotId={fillSlot} />
      <NewLessonSheet open={newOpen} onOpenChange={setNewOpen} />
      <ExportSheet lesson={lesson} open={exportOpen} onOpenChange={setExportOpen} />
      {givenOpen && <GivenSheet lesson={lesson} open={givenOpen} onOpenChange={setGivenOpen} />}
    </>
  );
}

function BlockPage({ lesson, block }: { lesson: Lesson; block: LessonBlock }) {
  const router = useRouter();
  const st = useStore.getState();
  const index = lesson.blocks.findIndex((b) => b.id === block.id);
  const prev = lesson.blocks[index - 1];
  const next = lesson.blocks[index + 1];
  const totals = lessonTotals(lesson);
  const back = () => router.push("/lesmaker/");
  return (
    <>
      <PageHeader
        title={`Blok ${index + 1}`}
        back={
          <Button variant="ghost" size="sm" onClick={back} className="-ml-2" aria-label="Terug naar de les">
            <ChevronLeft /> Les
          </Button>
        }
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Vorig blok" disabled={!prev} onClick={() => prev && router.replace(`/lesmaker/?blok=${prev.id}`)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Volgend blok" disabled={!next} onClick={() => next && router.replace(`/lesmaker/?blok=${next.id}`)}>
              <ChevronRight />
            </Button>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Blokacties">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem icon={<Copy />} onSelect={() => { const id = st.duplicateBlockInLesson(lesson.id, block.id); toast("Blok gedupliceerd"); if (id) router.replace(`/lesmaker/?blok=${id}`); }}>Dupliceren</MenuItem>
                <MenuItem icon={<BookmarkPlus />} onSelect={() => { st.saveItem(lessonBlockToTraining(block)); toast("Opgeslagen in je bibliotheek (Blokken)"); }}>Opslaan in bibliotheek</MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} danger onSelect={() => { const r = st.removeBlock(lesson.id, block.id); back(); if (r) toast("Blok verwijderd", { actionLabel: "Ongedaan maken", onAction: r.restore }); }}>Verwijderen</MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      >
        <p className="text-[13px] text-muted tabular">
          {lesson.title} · blok {formatDuration(blockSeconds(block))} · les {formatDuration(totals.planned)} / {formatDuration(totals.target)}
          {block.sourceBlockId && <span className="text-faint"> · kopie van bibliotheekblok (origineel blijft ongewijzigd)</span>}
        </p>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-2xl">
          <BlockForm value={block} onChange={(next) => st.updateBlock(lesson.id, block.id, () => next)} />
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={back} data-testid="block-done">
              Klaar
            </Button>
          </div>
        </div>
      </PageBody>
    </>
  );
}
