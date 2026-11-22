"use client";

import type { Exercise, Format, LessonBlock, LibraryKind, TrainingBlock, LessonTemplate } from "@/lib/domain/types";
import type { Phase } from "@/lib/domain/vocab";
import { useStore, selectLibrary } from "@/lib/store";
import { toast, useUi } from "@/lib/store/ui";
import {
  addExerciseToBlock,
  applyFormatToBlock,
  blockFromExercise,
  blockFromFormat,
  blockFromTraining,
  fillWithTraining,
  lessonFromTemplate,
  newLesson,
} from "@/lib/data/lesson-ops";
import { itemName } from "@/lib/data/library";

const st = () => useStore.getState();

/** Zorgt voor een actieve les; maakt er zo nodig een aan. */
export function ensureActiveLesson(): string {
  const s = st();
  const id = s.data.prefs.activeLessonId;
  if (id && s.data.lessons[id] && !s.data.lessons[id].deletedAt) return id;
  const created = s.createLesson(newLesson(s.data.prefs), true);
  toast("Nieuwe les aangemaakt");
  return created;
}

function addBlockWithUndo(block: LessonBlock, label: string, index?: number) {
  const lessonId = ensureActiveLesson();
  st().addBlocks(lessonId, [block], index);
  const pos = (st().data.lessons[lessonId]?.blocks.findIndex((b) => b.id === block.id) ?? 0) + 1;
  toast(`${label} toegevoegd als blok ${pos}`, {
    actionLabel: "Ongedaan maken",
    onAction: () => st().removeBlock(lessonId, block.id),
  });
  return { lessonId, blockId: block.id };
}

export function addExerciseAsBlock(e: Exercise) {
  st().touchRecent("exercise", e.id);
  return addBlockWithUndo(blockFromExercise(e), e.name);
}

export function addExerciseToExistingBlock(e: Exercise, blockId: string) {
  const lessonId = ensureActiveLesson();
  const lesson = st().data.lessons[lessonId];
  const before = lesson.blocks.find((b) => b.id === blockId);
  if (!before) return addExerciseAsBlock(e);
  st().touchRecent("exercise", e.id);
  st().updateBlock(lessonId, blockId, (b) => addExerciseToBlock(b, e));
  const n = lesson.blocks.findIndex((b) => b.id === blockId) + 1;
  toast(`${e.name} toegevoegd aan blok ${n}`, { actionLabel: "Ongedaan maken", onAction: () => st().updateBlock(lessonId, blockId, () => before) });
  return { lessonId, blockId };
}

export function addFormatAsBlock(f: Format, exercises: Exercise[] = [], durationSec?: number, phase?: Phase) {
  st().touchRecent("format", f.id);
  return addBlockWithUndo(blockFromFormat(f, exercises, { durationSec, phase }), f.name);
}

export function applyFormatToExistingBlock(f: Format, blockId: string) {
  const lessonId = ensureActiveLesson();
  const lesson = st().data.lessons[lessonId];
  const before = lesson.blocks.find((b) => b.id === blockId);
  if (!before) return addFormatAsBlock(f);
  st().touchRecent("format", f.id);
  st().updateBlock(lessonId, blockId, (b) => applyFormatToBlock(b, f));
  toast(`${f.name} toegepast op blok ${lesson.blocks.indexOf(before) + 1}`, { actionLabel: "Ongedaan maken", onAction: () => st().updateBlock(lessonId, blockId, () => before) });
  return { lessonId, blockId };
}

export function addTrainingBlock(b: TrainingBlock, index?: number) {
  st().touchRecent("block", b.id);
  return addBlockWithUndo(blockFromTraining(b), b.title, index);
}

export function fillSlotWithTraining(b: TrainingBlock, slotId: string) {
  const lessonId = ensureActiveLesson();
  const lesson = st().data.lessons[lessonId];
  const before = lesson.blocks.find((x) => x.id === slotId);
  if (!before) return addTrainingBlock(b);
  st().touchRecent("block", b.id);
  st().updateBlock(lessonId, slotId, (slot) => fillWithTraining(slot, b));
  toast(`${b.title} ingevuld`, { actionLabel: "Ongedaan maken", onAction: () => st().updateBlock(lessonId, slotId, () => before) });
  return { lessonId, blockId: slotId };
}

export function startLessonFromTemplate(t: LessonTemplate) {
  const s = st();
  s.touchRecent("template", t.id);
  const id = s.createLesson(lessonFromTemplate(t, s.data.prefs), true);
  toast(`Les gestart vanuit ${t.name}`);
  return id;
}

/** Verwijdert of verbergt een bibliotheekitem met ongedaan-maken. */
export function deleteLibraryItem(kind: LibraryKind, id: string) {
  const lib = selectLibrary(st().data);
  const item = lib[kind].get(id);
  const res = st().deleteItem(kind, id);
  if (!res) return;
  toast(item?.builtin ? `${item ? itemName(item) : "Item"} verborgen` : `${item ? itemName(item) : "Item"} verwijderd`, { actionLabel: "Ongedaan maken", onAction: res.restore });
}

export function useTargetBlock() {
  return useUi((s) => s.targetBlockId);
}
