"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, LayoutList, MoreHorizontal, Settings2, Sparkles, Timer } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { SyncBadge } from "./sync-badge";

const MOBILE = [
  { href: "/bibliotheek/", label: "Bibliotheek", icon: BookOpen },
  { href: "/lesmaker/", label: "Lesmaker", icon: LayoutList },
  { href: "/lessen/", label: "Lessen", icon: CalendarDays },
  { href: "/meer/", label: "Meer", icon: MoreHorizontal },
];

const DESKTOP = [
  { href: "/bibliotheek/", label: "Bibliotheek", icon: BookOpen },
  { href: "/formatkiezer/", label: "Formatkiezer", icon: Sparkles },
  { href: "/lesmaker/", label: "Lesmaker", icon: LayoutList },
  { href: "/lessen/", label: "Mijn lessen", icon: CalendarDays },
  { href: "/coach/", label: "Coachmodus", icon: Timer },
  { href: "/meer/", label: "Instellingen", icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  const p = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (href === "/meer/" && p.startsWith("/formatkiezer/")) return false;
  return p.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hoofdnavigatie" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-sm pb-safe md:hidden">
      <ul className="mx-auto flex max-w-lg">
        {MOBILE.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href) || (href === "/bibliotheek/" && pathname.startsWith("/formatkiezer"));
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-accent" : "text-muted")}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">FL</span>
        <span className="text-[17px] font-semibold tracking-tight">FightLab</span>
      </div>
      <nav aria-label="Hoofdnavigatie" className="flex-1 px-3">
        <ul className="flex flex-col gap-0.5">
          {DESKTOP.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-[15px]", active ? "bg-subtle font-semibold text-ink" : "text-muted hover:bg-subtle hover:text-ink")}>
                  <Icon className={cn("size-[18px]", active && "text-accent")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-4">
        <SyncBadge expanded />
      </div>
    </aside>
  );
}
