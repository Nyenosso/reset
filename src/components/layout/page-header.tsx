import * as React from "react";
import { cn } from "@/components/ui/cn";

/** Compacte paginatitel met maximaal een paar acties. Blijft bovenaan staan. */
export function PageHeader({ title, actions, children, className, back }: { title: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; className?: string; back?: React.ReactNode }) {
  return (
    <header className={cn("no-print sticky top-0 z-20 border-b border-line/70 bg-bg/95 pt-safe backdrop-blur-sm", className)}>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        {back}
        <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children && <div className="mx-auto max-w-5xl px-4 pb-3">{children}</div>}
    </header>
  );
}

export function PageBody({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto px-4 pt-3 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-16", wide ? "max-w-6xl" : "max-w-5xl", className)}>{children}</div>;
}
