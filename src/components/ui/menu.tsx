"use client";

import * as React from "react";
import { DropdownMenu } from "radix-ui";
import { cn } from "./cn";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({ children, align = "end", className }: { children: React.ReactNode; align?: "start" | "end" | "center"; className?: string }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className={cn("z-50 min-w-[220px] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)] animate-fade-in", className)}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuItem({ children, onSelect, icon, danger, disabled }: { children: React.ReactNode; onSelect?: () => void; icon?: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-[15px] outline-none data-[highlighted]:bg-subtle data-[disabled]:opacity-40 [&_svg]:size-[18px] [&_svg]:text-muted",
        danger && "text-danger [&_svg]:text-danger",
      )}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Label className="px-2.5 pt-2 pb-1 text-xs font-medium text-faint">{children}</DropdownMenu.Label>;
}
