"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { clearOutboxEntries, flushLocalSave, getOutbox, onOutboxChange, resetOutbox, useStore } from "@/lib/store";
import { loadMeta, saveMeta } from "@/lib/store/persistence";
import { nowIso } from "@/lib/utils/id";
import { applyOutbox, mergeFirstLogin } from "./merge";
import { createSupabaseRemote, type Remote } from "./remote";

/**
 * Sync-engine: duwt de outbox (gedebounced) naar Supabase, haalt bij inloggen en
 * bij terugkeren naar de app de serverdata op, en houdt de status bij.
 * Zonder Supabase-configuratie blijft alles lokaal (demo-modus).
 */
let remote: Remote | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let retryMs = 3000;
let lastPull = 0;
let started = false;

const store = () => useStore.getState();

function scheduleFlush(delay = 800) {
  if (!remote) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), delay);
}

export async function flush(): Promise<void> {
  if (!remote || flushing) return;
  const entries = Object.entries(getOutbox());
  if (!entries.length) {
    store().setSync({ status: "saved", pending: 0 });
    return;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    store().setSync({ status: "offline" });
    return;
  }
  flushing = true;
  store().setSync({ status: "saving" });
  try {
    await remote.push(entries.map(([, e]) => e), store().data);
    clearOutboxEntries(entries.map(([key, e]) => ({ key, v: e.v })));
    retryMs = 3000;
    const meta = loadMeta();
    saveMeta({ ...meta, lastSyncedAt: nowIso() });
    store().setSync({ status: Object.keys(getOutbox()).length ? "saving" : "saved", lastSyncedAt: nowIso(), error: undefined });
    flushing = false;
    if (Object.keys(getOutbox()).length) scheduleFlush(200);
  } catch (err) {
    flushing = false;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    store().setSync({ status: offline ? "offline" : "error", error: err instanceof Error ? err.message : String(err) });
    retryMs = Math.min(retryMs * 2, 60000);
    scheduleFlush(retryMs);
  }
}

async function pullAndMerge(userId: string, firstTime: boolean) {
  if (!remote) return;
  store().setSync({ status: "saving" });
  const { data: remoteData, empty } = await remote.pull();
  const meta = loadMeta();
  const local = store().data;
  if (firstTime && meta.ownerId && meta.ownerId !== userId) {
    // Lokale data hoorde bij een ander account: vervang door de accountdata.
    resetOutbox();
    store().replaceData(remoteData);
  } else if (firstTime && !meta.ownerId) {
    // Eerste koppeling van dit apparaat: demo-gegevens meenemen naar het account.
    // Alles wordt als ‘te uploaden’ gemarkeerd; upserts van ongewijzigde serveritems zijn onschadelijk.
    const { data, upload } = mergeFirstLogin(local, remoteData);
    store().replaceData(data, { markAllDirty: empty || upload.length > 0 });
  } else {
    store().replaceData(applyOutbox(remoteData, local, getOutbox()));
  }
  saveMeta({ ...loadMeta(), ownerId: userId });
  lastPull = Date.now();
  await flush();
  store().setSync({ status: Object.keys(getOutbox()).length ? "saving" : "saved" });
}

async function onSession(client: SupabaseClient, session: Session | null, firstTime: boolean) {
  if (!session?.user) {
    remote = null;
    store().setSync({ mode: "local", status: "local", email: undefined, userId: undefined });
    return;
  }
  const userId = session.user.id;
  remote = createSupabaseRemote(client, userId);
  store().setSync({ mode: "cloud", status: "saving", email: session.user.email ?? undefined, userId });
  try {
    await pullAndMerge(userId, firstTime);
  } catch (err) {
    store().setSync({ status: "error", error: err instanceof Error ? err.message : String(err) });
    scheduleFlush(5000);
  }
}

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  store().hydrate();
  onOutboxChange(() => scheduleFlush());

  const persistNow = () => flushLocalSave();
  window.addEventListener("pagehide", persistNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistNow();
      if (remote) void flush();
    } else if (remote && Date.now() - lastPull > 60_000 && Object.keys(getOutbox()).length === 0) {
      const uid = store().sync.userId;
      if (uid) void pullAndMerge(uid, false).catch(() => undefined);
    }
  });
  window.addEventListener("online", () => scheduleFlush(100));
  window.addEventListener("offline", () => remote && store().setSync({ status: "offline" }));

  if (!supabaseConfigured) {
    store().setSync({ configured: false, mode: "local", status: "local" });
    return;
  }
  const client = getSupabase()!;
  store().setSync({ configured: true });
  let handled = false;
  client.auth.getSession().then(({ data }) => {
    handled = true;
    void onSession(client, data.session, true);
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && handled && store().sync.userId !== session?.user.id) void onSession(client, session, true);
    if (event === "SIGNED_OUT") void onSession(client, null, false);
  });
}

// ——— Inloggen met e-mailcode (OTP) of magic link ———
export async function sendLoginCode(email: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Supabase is niet ingesteld." };
  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/meer/` } });
  return error ? { ok: false, error: translateAuthError(error.message) } : { ok: true };
}

export async function verifyLoginCode(email: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Supabase is niet ingesteld." };
  const { error } = await client.auth.verifyOtp({ email, token, type: "email" });
  return error ? { ok: false, error: translateAuthError(error.message) } : { ok: true };
}

export async function signOut() {
  const client = getSupabase();
  await flush().catch(() => undefined);
  await client?.auth.signOut();
}

export async function syncNow() {
  const uid = store().sync.userId;
  if (!remote || !uid) return;
  await flush();
  await pullAndMerge(uid, false);
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("rate") || m.includes("seconds")) return "Even wachten: je kunt zo opnieuw een code aanvragen.";
  if (m.includes("expired") || m.includes("invalid")) return "De code is ongeldig of verlopen. Vraag een nieuwe code aan.";
  if (m.includes("email")) return "Controleer het e-mailadres.";
  return `Inloggen mislukt: ${msg}`;
}
