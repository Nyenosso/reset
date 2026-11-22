"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  BookmarkPlus,
  Copy,
  GripVertical,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Exercise, Format, Lesson, LessonBlock, TrainingBlock } from "@/lib/domain/types";
import { organizationLabel, phaseShort } from "@/lib/domain/vocab";
import { formatDuration, formatRpe } from "@/lib/time/format";
import { blockSeconds, blockTimeStatus } from "@/lib/time/structure";
import { useLibrary, useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { searchItems } from "@/lib/data/search";
import {
  addExerciseToBlock,
  adjustBlockDuration,
  applyFormatToBlock,
  blockFromExercise,
  blockFromFormat,
  blockFromTraining,
  fillWithTraining,
  lessonBlockToTraining,
} from "@/lib/data/lesson-ops";
import { blockContentLine } from "@/lib/data/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/components/ui/cn";
import { restrictToVerticalAxis } from "@/components/shared/dnd-modifiers";

type LibDrag = { type: "lib"; kind: "exercise"; item: Exercise } | { type: "lib"; kind: "format"; item: Format } | { type: "lib"; kind: "block"; item: TrainingBlock };

const collision: CollisionDetection = (args) => {
  const data = args.active.data.current as { type?: string } | undefined;
  if (data?.type === "lib") {
    const hits = pointerWithin(args);
    return hits.length ? hits : closestCenter(args);
  }
  return closestCenter(args);
};

export function LessonBoard({ lesson, onOpenBlock, onFill, highlight }: { lesson: Lesson; onOpenBlock: (id: string) => void; onFill: (blockId: string) => void; highlight?: string }) {
  const s = useStore.getState();
  const [active, setActive] = React.useState<{ id: string; data: LibDrag | { type: "block" } } | null>(null);
  const [moveFor, setMoveFor] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = lesson.blocks.map((b) => b.id);

  const onStart = (e: DragStartEvent) => setActive({ id: String(e.active.id), data: (e.active.data.current as LibDrag) ?? { type: "block" } });
  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    const over = e.over ? String(e.over.id) : null;
    const data = e.active.data.current as LibDrag | { type: "block" } | undefined;
    if (data?.type === "lib") {
      if (!over) return;
      dropLibraryItem(lesson, data, over);
      return;
    }
    if (!over || over === e.active.id || over === "lesson-end") return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(over);
    if (from >= 0 && to >= 0) s.moveBlock(lesson.id, from, to);
  };

  const activeBlock = active && active.data.type === "block" ? lesson.blocks.find((b) => b.id === active.id) : undefined;
  const activeLib = active && active.data.type === "lib" ? active.data : undefined;

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2" data-testid="block-list" aria-label="Blokken van de les">
              {lesson.blocks.map((b, i) => (
                <SortableBlock
                  key={b.id}
                  block={b}
                  index={i}
                  total={lesson.blocks.length}
                  libDragging={Boolean(activeLib)}
                  highlight={highlight === b.id}
                  onOpen={() => onOpenBlock(b.id)}
                  onFill={() => onFill(b.id)}
                  onMoveTo={() => setMoveFor(b.id)}
                  lessonId={lesson.id}
                />
              ))}
            </ol>
          </SortableContext>
          <EndDrop visible={Boolean(activeLib)} />
        </div>
        <LibraryPanel />
      </div>
      <DragOverlay dropAnimation={null} modifiers={activeBlock ? [restrictToVerticalAxis] : undefined}>
        {activeBlock ? (
          <div className="rounded-xl border border-accent bg-surface px-3 py-2.5 shadow-[var(--shadow-pop)]">
            <p className="font-semibold">{activeBlock.title}</p>
            <p className="text-[13px] text-muted">{formatDuration(blockSeconds(activeBlock))}</p>
          </div>
        ) : activeLib ? (
          <div className="inline-flex rounded-full bg-ink px-3 py-2 text-sm font-medium text-white shadow-[var(--shadow-pop)]">{"name" in activeLib.item ? activeLib.item.name : activeLib.item.title}</div>
        ) : null}
      </DragOverlay>
      <MoveSheet lesson={lesson} blockId={moveFor} onClose={() => setMoveFor(null)} />
    </DndContext>
  );
}

function dropLibraryItem(lesson: Lesson, d: LibDrag, overId: string) {
  const st = useStore.getState();
  if (overId === "lesson-end") {
    const block = d.kind === "exercise" ? blockFromExercise(d.item) : d.kind === "format" ? blockFromFormat(d.item) : blockFromTraining(d.item);
    st.addBlocks(lesson.id, [block]);
    toast(`${block.title} toegevoegd`, { actionLabel: "Ongedaan maken", onAction: () => st.removeBlock(lesson.id, block.id) });
    return;
  }
  const target = lesson.blocks.find((b) => b.id === overId);
  if (!target) return;
  const index = lesson.blocks.indexOf(target);
  if (d.kind === "block") {
    if (target.placeholder) {
      st.updateBlock(lesson.id, target.id, (slot) => fillWithTraining(slot, d.item));
      toast(`${d.item.title} ingevuld in blok ${index + 1}`, { actionLabel: "Ongedaan maken", onAction: () => st.updateBlock(lesson.id, target.id, () => target) });
    } else {
      const block = blockFromTraining(d.item);
      st.addBlocks(lesson.id, [block], index);
      toast(`${d.item.title} ingevoegd als blok ${index + 1}`, { actionLabel: "Ongedaan maken", onAction: () => st.removeBlock(lesson.id, block.id) });
    }
    return;
  }
  st.updateBlock(lesson.id, target.id, (b) => (d.kind === "exercise" ? addExerciseToBlock(b, d.item) : applyFormatToBlock(b, d.item)));
  toast(d.kind === "exercise" ? `${d.item.name} toegevoegd aan blok ${index + 1}` : `${d.item.name} toegepast op blok ${index + 1}`, {
    actionLabel: "Ongedaan maken",
    onAction: () => st.updateBlock(lesson.id, target.id, () => target),
  });
}

function EndDrop({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "lesson-end" });
  return (
    <div ref={setNodeRef} className={cn("mt-2 grid h-14 place-items-center rounded-xl border-2 border-dashed text-sm text-faint transition-colors", visible ? "border-line-strong" : "hidden", isOver && "border-accent bg-accent-soft text-accent")}>
      Loslaten om als nieuw blok toe te voegen
    </div>
  );
}

function SortableBlock({ block, index, total, libDragging, highlight, onOpen, onFill, onMoveTo, lessonId }: { block: LessonBlock; index: number; total: number; libDragging: boolean; highlight: boolean; onOpen: () => void; onFill: () => void; onMoveTo: () => void; lessonId: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: block.id, data: { type: "block" } });
  const s = useStore.getState();
  const time = blockTimeStatus(block);
  const content = blockContentLine(block);
  const meta = [formatDuration(blockSeconds(block)), organizationLabel(block.organization), formatRpe(block.rpe)].join(" · ");
  return (
    <li
      ref={setNodeRef}
      id={`block-${block.id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-40")}
      data-testid="lesson-block"
      data-block-title={block.title}
    >
      <div
        className={cn(
          "flex items-stretch rounded-xl border bg-surface transition-colors",
          block.placeholder ? "border-dashed border-line-strong bg-subtle/40" : "border-line",
          libDragging && isOver && "border-accent ring-2 ring-accent/30",
          highlight && "ring-2 ring-accent/40",
        )}
      >
        <button type="button" onClick={block.placeholder ? onFill : onOpen} className="min-w-0 flex-1 px-3 py-2.5 text-left" aria-label={`Blok ${index + 1}: ${block.title} ${block.placeholder ? "invullen" : "bewerken"}`}>
          <p className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-faint tabular">{String(index + 1).padStart(2, "0")}</span>
            <span className="truncate text-[15px] font-semibold">{block.title}</span>
          </p>
          {block.placeholder ? (
            <p className="mt-0.5 text-[13px] text-muted">
              {phaseShort(block.phase)} · {formatDuration(block.durationSec)} · <span className="font-medium text-accent">Vul in</span>
            </p>
          ) : (
            <>
              {block.formatName && block.formatName !== block.title && <p className="truncate text-[14px]">{block.formatName}</p>}
              {content && <p className="truncate text-[13px] text-muted">{content}</p>}
              <p className={cn("text-[13px] tabular", time.mismatch ? "text-warn" : "text-faint")}>
                {meta}
                {time.mismatch && " · structuur wijkt af"}
              </p>
            </>
          )}
        </button>
        <div className="flex shrink-0 flex-col items-center justify-center pr-1">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            aria-label={`Sleep blok ${index + 1} naar een andere positie`}
            className="grid size-11 cursor-grab touch-none place-items-center rounded-lg text-faint hover:bg-subtle active:cursor-grabbing"
            data-testid="drag-handle"
          >
            <GripVertical className="size-5" />
          </button>
          <Menu>
            <MenuTrigger asChild>
              <button type="button" aria-label={`Acties voor blok ${index + 1}`} className="grid size-11 place-items-center rounded-lg text-faint hover:bg-subtle" data-testid="block-menu">
                <MoreHorizontal className="size-5" />
              </button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem icon={<Pencil />} onSelect={block.placeholder ? onFill : onOpen}>{block.placeholder ? "Invullen" : "Bewerken"}</MenuItem>
              <MenuItem icon={<Copy />} onSelect={() => { s.duplicateBlockInLesson(lessonId, block.id); toast("Blok gedupliceerd"); }}>Dupliceren</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<ArrowUp />} disabled={index === 0} onSelect={() => s.moveBlock(lessonId, index, index - 1)}>Verplaats omhoog</MenuItem>
              <MenuItem icon={<ArrowDown />} disabled={index === total - 1} onSelect={() => s.moveBlock(lessonId, index, index + 1)}>Verplaats omlaag</MenuItem>
              <MenuItem icon={<ArrowDownToLine />} onSelect={onMoveTo}>Verplaats naar…</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Plus />} onSelect={() => s.updateBlock(lessonId, block.id, (b) => adjustBlockDuration(b, 30))}>+30 sec</MenuItem>
              <MenuItem icon={<Plus />} onSelect={() => s.updateBlock(lessonId, block.id, (b) => adjustBlockDuration(b, 60))}>+1 min</MenuItem>
              <MenuItem icon={<Minus />} onSelect={() => s.updateBlock(lessonId, block.id, (b) => adjustBlockDuration(b, -30))}>−30 sec</MenuItem>
              <MenuSeparator />
              {!block.placeholder && (
                <MenuItem icon={<BookmarkPlus />} onSelect={() => { s.saveItem(lessonBlockToTraining(block)); toast("Opgeslagen in je bibliotheek (Blokken)"); }}>Opslaan in bibliotheek</MenuItem>
              )}
              <MenuItem icon={<Trash2 />} danger onSelect={() => { const r = s.removeBlock(lessonId, block.id); if (r) toast("Blok verwijderd", { actionLabel: "Ongedaan maken", onAction: r.restore }); }}>
                Verwijderen
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </li>
  );
}

function MoveSheet({ lesson, blockId, onClose }: { lesson: Lesson; blockId: string | null; onClose: () => void }) {
  const move = useStore((s) => s.moveBlock);
  const from = blockId ? lesson.blocks.findIndex((b) => b.id === blockId) : -1;
  return (
    <Sheet open={from >= 0} onOpenChange={(v) => !v && onClose()} title="Verplaats naar…" size="sm">
      <ol className="flex flex-col">
        {lesson.blocks.map((b, i) => (
          <li key={b.id}>
            <button
              type="button"
              disabled={i === from}
              onClick={() => {
                move(lesson.id, from, i);
                onClose();
              }}
              className="flex h-12 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-subtle disabled:opacity-40"
            >
              <span className="w-7 text-[13px] font-semibold text-faint tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate">{i === from ? `${b.title} (huidige positie)` : `Positie ${i + 1} — vóór/na ${b.title}`}</span>
            </button>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

// ——— Desktop: bibliotheekpaneel met sleepbare items ———
function LibraryPanel() {
  const lib = useLibrary();
  const [tab, setTab] = React.useState<"exercise" | "format" | "block">("block");
  const [q, setQ] = React.useState("");
  const list = React.useMemo(() => {
    const src = tab === "exercise" ? lib.exercises : tab === "format" ? lib.formats : lib.blocks;
    return searchItems(src as (Exercise | Format | TrainingBlock)[], q).slice(0, 60);
  }, [lib, tab, q]);
  return (
    <aside className="hidden lg:block" aria-label="Bibliotheek om te slepen">
      <div className="sticky top-[72px] flex max-h-[calc(100dvh-96px)] flex-col rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-3">
          <p className="mb-2 text-[13px] font-semibold text-muted">Sleep naar de les</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoeken" className="h-10 pl-9" aria-label="Zoek in bibliotheekpaneel" />
          </div>
          <Segmented className="mt-2" label="Soort" value={tab} onChange={setTab} options={[{ id: "block", label: "Blokken" }, { id: "format", label: "Formats" }, { id: "exercise", label: "Oefeningen" }]} />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {list.map((item) => (
            <DraggableLibItem key={item.id} item={item} />
          ))}
        </ul>
        <p className="border-t border-line px-3 py-2 text-xs text-faint">Oefening op blok = toevoegen · format op blok = structuur vervangen · blok = invoegen</p>
      </div>
    </aside>
  );
}

function DraggableLibItem({ item }: { item: Exercise | Format | TrainingBlock }) {
  const data: LibDrag = { type: "lib", kind: item.kind, item } as LibDrag;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lib:${item.kind}:${item.id}`, data });
  const name = "name" in item ? item.name : item.title;
  const sub = item.kind === "block" ? formatDuration(blockSeconds(item)) : item.kind === "format" ? item.description : item.description;
  return (
    <li ref={setNodeRef} {...attributes} {...listeners} className={cn("flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 hover:bg-subtle active:cursor-grabbing", isDragging && "opacity-40")}>
      <GripVertical className="size-4 shrink-0 text-faint" />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium">{name}</span>
        <span className="block truncate text-[12px] text-muted">{sub}</span>
      </span>
    </li>
  );
}

export function AddBlockButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="primary" size="lg" onClick={onClick} className="w-full" data-testid="add-block">
      <Plus /> Voeg blok toe
    </Button>
  );
}
