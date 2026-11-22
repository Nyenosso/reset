"use client";

/** Piepjes via Web Audio en trillen (alleen waar ondersteund; iOS Safari ondersteunt trillen niet). */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function beep(freq = 880, ms = 160, volume = 0.25) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch {
    /* noop */
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* noop */
  }
}

export function canVibrate() {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

type WakeLockSentinelLike = { release: () => Promise<void> };
let lock: WakeLockSentinelLike | null = null;

export async function keepAwake(on: boolean) {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } }).wakeLock;
    if (on && wl && !lock) lock = await wl.request("screen");
    if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  }
}

export function wakeLockSupported() {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function resetWakeLockHandle() {
  lock = null;
}
