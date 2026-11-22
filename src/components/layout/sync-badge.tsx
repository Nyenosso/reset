"use client";

import Link from "next/link";
import { Cloud, CloudOff, HardDrive, Loader2, Check, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/components/ui/cn";

export function useSyncLabel() {
  const sync = useStore((s) => s.sync);
  if (sync.mode === "local") {
    return {
      icon: HardDrive,
      label: sync.configured ? "Niet ingelogd · alleen op dit apparaat" : "Demo · alleen op dit apparaat",
      short: "Lokaal",
      tone: "muted" as const,
    };
  }
  switch (sync.status) {
    case "saving":
      return { icon: Loader2, label: "Opslaan…", short: "Opslaan…", tone: "muted" as const, spin: true };
    case "offline":
      return { icon: CloudOff, label: `Offline · ${sync.pending} wijziging(en) wachten`, short: "Offline", tone: "warn" as const };
    case "error":
      return { icon: AlertTriangle, label: "Niet gesynchroniseerd", short: "Niet gesynchroniseerd", tone: "warn" as const };
    case "saved":
      return { icon: Check, label: "Opgeslagen in de cloud", short: "Opgeslagen", tone: "ok" as const };
    default:
      return { icon: Cloud, label: "Verbonden", short: "Cloud", tone: "muted" as const };
  }
}

export function SyncBadge({ expanded }: { expanded?: boolean }) {
  const s = useSyncLabel();
  const Icon = s.icon;
  return (
    <Link
      href="/meer/#account"
      title={s.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-xs font-medium",
        expanded ? "w-full" : "h-8 px-2.5",
        s.tone === "ok" && "text-ok",
        s.tone === "warn" && "text-warn",
        s.tone === "muted" && "text-faint",
      )}
      data-testid="sync-badge"
    >
      <Icon className={cn("size-4 shrink-0", s.spin && "animate-spin")} />
      <span className={expanded ? "" : "hidden sm:inline"}>{expanded ? s.label : s.short}</span>
    </Link>
  );
}
