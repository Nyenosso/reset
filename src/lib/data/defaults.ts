import type { Preferences, UserData } from "@/lib/domain/types";
import { ALL_EQUIPMENT, type Equipment } from "@/lib/domain/vocab";

export const DEFAULT_EQUIPMENT_COUNTS: Record<Equipment, number> = {
  bokszak: 16,
  pads: 10,
  trapkussen: 10,
  slamball: 10,
  gewichtjes: 20,
  flexibeam: 6,
  lichaamsgewicht: 999,
};

export const DEFAULT_PREFS: Preferences = {
  defaultParticipants: 20,
  defaultTargetSec: 3600,
  defaultOrganization: "tweetallen",
  defaultAudience: "Gemengd niveau",
  equipmentAvailable: [...ALL_EQUIPMENT],
  equipmentCounts: { ...DEFAULT_EQUIPMENT_COUNTS },
  soundEnabled: true,
  vibrationEnabled: true,
  keepScreenOn: true,
};

export function emptyUserData(): UserData {
  return {
    version: 1,
    exercises: {},
    formats: {},
    blocks: {},
    templates: {},
    lessons: {},
    hidden: [],
    favorites: [],
    recent: [],
    prefs: { ...DEFAULT_PREFS, equipmentCounts: { ...DEFAULT_EQUIPMENT_COUNTS }, equipmentAvailable: [...ALL_EQUIPMENT] },
  };
}

export function withPrefDefaults(p: Partial<Preferences> | undefined): Preferences {
  return {
    ...DEFAULT_PREFS,
    ...(p ?? {}),
    equipmentCounts: { ...DEFAULT_EQUIPMENT_COUNTS, ...(p?.equipmentCounts ?? {}) },
    equipmentAvailable: p?.equipmentAvailable ?? [...ALL_EQUIPMENT],
  };
}
