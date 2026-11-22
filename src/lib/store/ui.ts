"use client";

import { create } from "zustand";
import type { BlockFilters, ExerciseFilters, FormatFilters } from "@/lib/data/search";
import type { PickerFilters } from "@/lib/data/recommend";
import { newId } from "@/lib/utils/id";

export type LibTab = "oefeningen" | "formats" | "blokken" | "structuren";

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "error";
  actionLabel?: string;
  onAction?: () => void;
}

interface UiState {
  libTab: LibTab;
  queries: Record<LibTab, string>;
  favOnly: Record<LibTab, boolean>;
  exerciseFilters: ExerciseFilters;
  formatFilters: FormatFilters;
  blockFilters: BlockFilters;
  picker: PickerFilters;
  /** Doelblok voor ‘toevoegen aan blok’ vanuit de bibliotheek. */
  targetBlockId?: string;
  toasts: Toast[];
  setLibTab(t: LibTab): void;
  setQuery(t: LibTab, q: string): void;
  toggleFavOnly(t: LibTab): void;
  setExerciseFilters(f: ExerciseFilters): void;
  setFormatFilters(f: FormatFilters): void;
  setBlockFilters(f: BlockFilters): void;
  setPicker(p: Partial<PickerFilters>): void;
  resetPicker(): void;
  setTargetBlock(id?: string): void;
  toast(t: Omit<Toast, "id">): void;
  dismiss(id: string): void;
}

export const DEFAULT_PICKER: PickerFilters = { goals: [], equipment: [], onlyAvailable: true };

export const useUi = create<UiState>()((set) => ({
  libTab: "oefeningen",
  queries: { oefeningen: "", formats: "", blokken: "", structuren: "" },
  favOnly: { oefeningen: false, formats: false, blokken: false, structuren: false },
  exerciseFilters: {},
  formatFilters: {},
  blockFilters: {},
  picker: { ...DEFAULT_PICKER },
  toasts: [],
  setLibTab: (libTab) => set({ libTab }),
  setQuery: (t, q) => set((s) => ({ queries: { ...s.queries, [t]: q } })),
  toggleFavOnly: (t) => set((s) => ({ favOnly: { ...s.favOnly, [t]: !s.favOnly[t] } })),
  setExerciseFilters: (exerciseFilters) => set({ exerciseFilters }),
  setFormatFilters: (formatFilters) => set({ formatFilters }),
  setBlockFilters: (blockFilters) => set({ blockFilters }),
  setPicker: (p) => set((s) => ({ picker: { ...s.picker, ...p } })),
  resetPicker: () => set({ picker: { ...DEFAULT_PICKER } }),
  setTargetBlock: (targetBlockId) => set({ targetBlockId }),
  toast: (t) => {
    const id = newId("t");
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.onAction ? 6500 : 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (message: string, opts: Omit<Toast, "id" | "message"> = {}) => useUi.getState().toast({ message, ...opts });
