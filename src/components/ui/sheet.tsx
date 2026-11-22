"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "./cn";

/**
 * Bottom sheet op mobiel, zijpaneel op desktop. Gebaseerd op Radix Dialog
 * (focusbeheer, Escape, aria). Houdt de onderliggende lijst en scrollpositie intact.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  hideTitle?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/25 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-surface outline-none animate-sheet-up",
            "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl shadow-[var(--shadow-sheet)]",
            "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-dvh md:max-h-none md:rounded-none md:rounded-l-2xl",
            size === "sm" && "md:w-[400px]",
            size === "md" && "md:w-[520px]",
            size === "lg" && "md:w-[680px]",
          )}
          tabIndex={-1}
          onOpenAutoFocus={(e) => {
            // Geen focusring op ‘Sluiten’ bij openen; velden met autoFocus behouden hun focus.
            e.preventDefault();
            const el = e.currentTarget as HTMLElement;
            if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
          }}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line md:hidden" aria-hidden />
          <div className={cn("flex items-start gap-3 px-4 pt-3 pb-2", hideTitle && "sr-only")}>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[17px] font-semibold leading-tight">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Paneel"}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-2 -mt-1 grid size-10 place-items-center rounded-full text-muted hover:bg-subtle" aria-label="Sluiten">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer && <div className="border-t border-line bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
          {!footer && <div className="pb-safe" />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
