"use client";

import * as React from "react";
import type { Step } from "./timeline";
import { beep, keepAwake, resetWakeLockHandle, unlockAudio, vibrate } from "./signals";

interface Persisted {
  index: number;
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
}

/**
 * Timer op basis van absolute eindtijden (Date.now), zodat de tijd klopt
 * ook als de browser de pagina tijdelijk vertraagt of het scherm even uit was.
 */
export function useCoachTimer(steps: Step[], opts: { storageKey: string; sound: boolean; vibration: boolean; keepScreenOn: boolean }) {
  const load = (): Persisted => {
    try {
      const raw = localStorage.getItem(opts.storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (p.index < steps.length) return p;
      }
    } catch {
      /* noop */
    }
    return { index: 0, running: false, endsAt: null, remainingMs: (steps[0]?.seconds ?? 0) * 1000 };
  };
  const [state, setState] = React.useState<Persisted>(load);
  const [now, setNow] = React.useState(() => Date.now());
  const lastBeep = React.useRef<string>("");
  const optsRef = React.useRef(opts);
  React.useEffect(() => {
    optsRef.current = opts;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(opts.storageKey, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state, opts.storageKey]);

  // Tikken + automatisch doorschuiven naar de volgende stap.
  React.useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => {
        if (!s.running || s.endsAt === null || t < s.endsAt) return s;
        let index = s.index;
        let endsAt = s.endsAt;
        while (t >= endsAt) {
          index += 1;
          if (index >= steps.length) return { index: steps.length - 1, running: false, endsAt: null, remainingMs: 0 };
          endsAt += steps[index].seconds * 1000;
        }
        return { ...s, index, endsAt };
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [state.running, steps]);

  const remainingMs = state.running && state.endsAt !== null ? Math.max(0, state.endsAt - now) : state.remainingMs;
  const current = steps[state.index];

  // Signalen: begin van een stap en de laatste drie seconden.
  React.useEffect(() => {
    if (!state.running || !current) return;
    const sec = Math.ceil(remainingMs / 1000);
    const key = `${state.index}:${sec}`;
    if (lastBeep.current === key) return;
    const o = optsRef.current;
    if (sec === current.seconds && lastBeep.current.split(":")[0] !== String(state.index)) {
      if (o.sound) beep(current.kind === "work" ? 1046 : 660, 260, 0.3);
      if (o.vibration) vibrate(current.kind === "work" ? [200, 80, 200] : 150);
    } else if (sec <= 3 && sec >= 1 && current.seconds > 5) {
      if (o.sound) beep(880, 90, 0.18);
    }
    lastBeep.current = key;
  }, [remainingMs, state.index, state.running, current]);

  // Scherm aan houden zolang de timer loopt.
  React.useEffect(() => {
    const want = state.running && opts.keepScreenOn;
    void keepAwake(want);
    const onVis = () => {
      if (document.visibilityState === "visible" && want) {
        resetWakeLockHandle();
        void keepAwake(true);
        setNow(Date.now());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [state.running, opts.keepScreenOn]);
  React.useEffect(() => () => void keepAwake(false), []);

  const go = (index: number, running = state.running) => {
    const i = Math.max(0, Math.min(steps.length - 1, index));
    const ms = (steps[i]?.seconds ?? 0) * 1000;
    lastBeep.current = "";
    setNow(Date.now());
    setState({ index: i, running, endsAt: running ? Date.now() + ms : null, remainingMs: ms });
  };

  return {
    index: state.index,
    running: state.running,
    remainingMs,
    current,
    start() {
      unlockAudio();
      const ms = state.remainingMs > 0 ? state.remainingMs : (current?.seconds ?? 0) * 1000;
      setNow(Date.now());
      setState((s) => ({ ...s, running: true, endsAt: Date.now() + ms, remainingMs: ms }));
    },
    pause() {
      setState((s) => ({ ...s, running: false, endsAt: null, remainingMs: s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs }));
    },
    next: () => go(state.index + 1),
    /** Na meer dan 3 seconden: huidige stap opnieuw; anders naar de vorige stap. */
    prev: () => go((current?.seconds ?? 0) * 1000 - remainingMs > 3000 ? state.index : state.index - 1),
    reset: () => go(0, false),
    jump: (i: number) => go(i),
  };
}
