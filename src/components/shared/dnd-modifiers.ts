import type { Modifier } from "@dnd-kit/core";

/** Beperkt slepen tot de verticale as (zonder extra dependency). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
