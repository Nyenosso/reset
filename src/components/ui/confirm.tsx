"use client";

import * as React from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "./button";

export function Confirm({ open, onOpenChange, title, description, confirmLabel = "Verwijderen", onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[70] bg-ink/30" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-5 shadow-[var(--shadow-pop)]">
          <AlertDialog.Title className="text-[17px] font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-[15px] text-muted">{description}</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Annuleren</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="danger" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
