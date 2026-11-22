"use client";

import * as React from "react";

/** Rendert lange lijsten in porties zodra de gebruiker naar beneden scrolt. */
export function IncrementalList<T>({ items, render, initial = 40, step = 60, getKey, className }: { items: T[]; render: (item: T, index: number) => React.ReactNode; initial?: number; step?: number; getKey: (item: T) => string; className?: string }) {
  const [count, setCount] = React.useState(initial);
  const sentinel = React.useRef<HTMLDivElement>(null);
  const key = items.length > 0 ? getKey(items[0]) + items.length : "empty";

  const [prevKey, setPrevKey] = React.useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setCount(initial);
  }

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || count >= items.length) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setCount((c) => Math.min(items.length, c + step));
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [count, items.length, step]);

  return (
    <>
      <ul className={className}>
        {items.slice(0, count).map((it, i) => (
          <li key={getKey(it)}>{render(it, i)}</li>
        ))}
      </ul>
      {count < items.length && <div ref={sentinel} className="h-10" aria-hidden />}
    </>
  );
}
