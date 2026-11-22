"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { startSync } from "@/lib/sync/engine";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav, Sidebar } from "./nav";
import { usePathname } from "next/navigation";

/** Start opslag/sync, toont navigatie en rendert pagina’s pas als de lokale data geladen is. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const ready = useStore((s) => s.ready);
  const pathname = usePathname();
  const chromeless = pathname.startsWith("/coach") || pathname.startsWith("/print");

  React.useEffect(() => {
    startSync();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  if (chromeless) {
    return (
      <>
        {ready ? children : <Loading />}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main id="main" className="min-h-dvh md:pl-[232px]">
        {ready ? children : <Loading />}
      </main>
      <BottomNav />
      <Toaster />
    </>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center text-sm text-faint" aria-busy="true">
      FightLab laden…
    </div>
  );
}
