/** Maakt van een naam een stabiele slug voor ids: "Bob & Weave + Hooks" → "bob-weave-hooks". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/&/g, " ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normaliseert tekst voor zoeken: geen accenten, kleine letters, uniforme scheidingstekens. */
export function normalizeSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splitst een zoekvraag in tokens. Combinaties als "1-2-3" blijven één token. */
export function searchTokens(query: string): string[] {
  return normalizeSearch(query)
    .split(/[\s,/]+/)
    .map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter(Boolean);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
