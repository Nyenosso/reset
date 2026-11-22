"use client";

import { useUi } from "@/lib/store/ui";
import { cn } from "./cn";

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-[232px]" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={cn("pointer-events-auto flex min-h-11 w-full max-w-md items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] text-white shadow-[var(--shadow-pop)] animate-sheet-up", t.tone === "error" ? "bg-danger" : "bg-ink")}>
          <span className="flex-1">{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              className="-my-1 h-9 rounded-lg px-2 font-semibold text-[#ffb38f] hover:bg-white/10"
              onClick={() => {
                t.onAction?.();
                dismiss(t.id);
              }}
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
