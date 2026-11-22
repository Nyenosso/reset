"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Cloud, Download, EyeOff, HardDrive, LogOut, RefreshCw, Smartphone, Sparkles, Timer, Trash2, Upload } from "lucide-react";
import type { UserData } from "@/lib/domain/types";
import { EQUIPMENT, ORGANIZATIONS, STRIKE_NUMBERS, type Equipment, type Organization } from "@/lib/domain/vocab";
import { useLibrary, useStore } from "@/lib/store";
import { toast } from "@/lib/store/ui";
import { backupToJson, parseImport } from "@/lib/data/validation";
import { downloadFile } from "@/lib/data/export";
import { duplicateLesson } from "@/lib/data/lesson-ops";
import { SEED_BY_KIND } from "@/lib/data/library";
import { sendLoginCode, signOut, syncNow, verifyLoginCode } from "@/lib/sync/engine";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { useSyncLabel } from "@/components/layout/sync-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Confirm } from "@/components/ui/confirm";
import { SectionTitle } from "@/components/ui/empty";
import { Toggle } from "@/components/shared/form";
import { cn } from "@/components/ui/cn";

function Card({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <div id={id} className={cn("scroll-mt-20 rounded-xl border border-line bg-surface p-3", className)}>
      {children}
    </div>
  );
}

export function SettingsView() {
  return (
    <>
      <PageHeader title="Meer" />
      <PageBody>
        <div className="mx-auto flex max-w-2xl flex-col">
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <QuickLink href="/formatkiezer/" icon={<Sparkles />} label="Formatkiezer" />
            <QuickLink href="/coach/" icon={<Timer />} label="Coachmodus" />
            <QuickLink href="/bibliotheek/?tab=structuren" icon={<BookOpen />} label="Structuren" />
          </div>
          <SectionTitle>Account & synchronisatie</SectionTitle>
          <AccountCard />
          <SectionTitle>Standaard voor nieuwe lessen</SectionTitle>
          <DefaultsCard />
          <SectionTitle>Beschikbaar materiaal</SectionTitle>
          <EquipmentCard />
          <SectionTitle>Coachmodus</SectionTitle>
          <CoachCard />
          <SectionTitle>Gegevens</SectionTitle>
          <DataCard />
          <SectionTitle>Over FightLab</SectionTitle>
          <AboutCard />
        </div>
      </PageBody>
    </>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface py-3 text-[13px] font-medium [&_svg]:size-5 [&_svg]:text-accent">
      {icon}
      {label}
    </Link>
  );
}

function AccountCard() {
  const sync = useStore((s) => s.sync);
  const label = useSyncLabel();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!sync.configured) {
    return (
      <Card id="account">
        <p className="flex items-center gap-2 font-medium">
          <HardDrive className="size-5 text-faint" /> Demo-modus
        </p>
        <p className="mt-1 text-[14px] text-muted">
          Alles wordt alleen in deze browser op dit apparaat bewaard en synchroniseert niet. Maak regelmatig een back-up (hieronder) of koppel Supabase om je gegevens veilig in de cloud te bewaren en op al je apparaten te gebruiken. Zie de README, hoofdstuk ‘Supabase koppelen’.
        </p>
      </Card>
    );
  }
  if (sync.mode === "cloud") {
    return (
      <Card id="account">
        <p className="flex items-center gap-2 font-medium">
          <Cloud className="size-5 text-ok" /> {sync.email}
        </p>
        <p className="mt-1 text-[14px] text-muted">
          {label.label}
          {sync.lastSyncedAt ? ` · laatst ${new Date(sync.lastSyncedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}` : ""}
          {sync.pending ? ` · ${sync.pending} wijziging(en) in de wachtrij` : ""}
        </p>
        {sync.error && sync.status === "error" && <p className="mt-1 text-[13px] text-warn">{sync.error}</p>}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void syncNow()}>
            <RefreshCw /> Nu synchroniseren
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut /> Uitloggen
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card id="account">
      <p className="font-medium">Inloggen</p>
      <p className="mt-1 text-[14px] text-muted">Je krijgt een e-mail met een inlogcode (en een link). Gebruik de code als je FightLab als app op je beginscherm hebt staan. Tot je inlogt, blijven wijzigingen alleen op dit apparaat.</p>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const r = step === "email" ? await sendLoginCode(email.trim()) : await verifyLoginCode(email.trim(), code.trim());
          setBusy(false);
          if (!r.ok) setError(r.error ?? "Er ging iets mis.");
          else if (step === "email") {
            setStep("code");
            toast("Code verstuurd: check je e-mail");
          } else toast("Ingelogd");
        }}
      >
        {step === "email" ? (
          <Input type="email" autoComplete="email" inputMode="email" required placeholder="jij@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mailadres" />
        ) : (
          <Input inputMode="numeric" autoComplete="one-time-code" required placeholder="Code uit de e-mail" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Inlogcode" maxLength={10} />
        )}
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {step === "email" ? "Stuur inlogcode" : "Inloggen"}
          </Button>
          {step === "code" && (
            <Button type="button" variant="ghost" onClick={() => setStep("email")}>
              Ander e-mailadres
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function DefaultsCard() {
  const prefs = useStore((s) => s.data.prefs);
  const update = useStore((s) => s.updatePrefs);
  return (
    <Card className="grid grid-cols-2 gap-3">
      <Field label="Deelnemers">
        <Stepper label="Standaard aantal deelnemers" value={prefs.defaultParticipants} min={1} max={60} onChange={(defaultParticipants) => update({ defaultParticipants })} />
      </Field>
      <Field label="Lesduur">
        <Stepper label="Standaard lesduur" value={Math.round(prefs.defaultTargetSec / 60)} min={10} max={180} step={5} format={(v) => `${v} min`} onChange={(v) => update({ defaultTargetSec: v * 60 })} />
      </Field>
      <Field label="Organisatie">
        <Select value={prefs.defaultOrganization} onChange={(e) => update({ defaultOrganization: e.target.value as Organization })} aria-label="Standaard organisatie">
          {ORGANIZATIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Doelgroep">
        <Input value={prefs.defaultAudience} onChange={(e) => update({ defaultAudience: e.target.value })} aria-label="Standaard doelgroep" />
      </Field>
    </Card>
  );
}

function EquipmentCard() {
  const prefs = useStore((s) => s.data.prefs);
  const update = useStore((s) => s.updatePrefs);
  return (
    <Card>
      <ul className="divide-y divide-line">
        {EQUIPMENT.filter((e) => e.id !== "lichaamsgewicht").map((e) => {
          const on = prefs.equipmentAvailable.includes(e.id);
          return (
            <li key={e.id} className="flex items-center gap-3 py-1.5">
              <div className="flex-1">
                <Toggle
                  label={e.label}
                  checked={on}
                  onChange={(v) => update({ equipmentAvailable: v ? [...prefs.equipmentAvailable, e.id] : prefs.equipmentAvailable.filter((x) => x !== e.id) })}
                />
              </div>
              <Stepper label={`Aantal ${e.label}`} value={prefs.equipmentCounts[e.id as Equipment] ?? 0} min={0} max={100} onChange={(v) => update({ equipmentCounts: { ...prefs.equipmentCounts, [e.id]: v } })} />
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-faint">Pads en trapkussens tellen per paar/stuk. Deze aantallen gebruikt de lescontrole om te waarschuwen bij te weinig materiaal.</p>
    </Card>
  );
}

function CoachCard() {
  const prefs = useStore((s) => s.data.prefs);
  const update = useStore((s) => s.updatePrefs);
  const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
  return (
    <Card>
      <Toggle label="Geluidssignaal bij wissels" checked={prefs.soundEnabled} onChange={(soundEnabled) => update({ soundEnabled })} hint="Korte piep bij elk nieuw interval en drie tellen voor het einde." />
      <Toggle label="Trillen" checked={prefs.vibrationEnabled} onChange={(vibrationEnabled) => update({ vibrationEnabled })} hint={canVibrate ? "Wordt door dit apparaat ondersteund." : "Niet ondersteund in deze browser (iPhone/Safari ondersteunt trillen niet)."} />
      <Toggle label="Scherm aan houden" checked={prefs.keepScreenOn} onChange={(keepScreenOn) => update({ keepScreenOn })} hint="Vraagt de browser het scherm niet te dimmen zolang de coachmodus open is." />
    </Card>
  );
}

function mergeBackup(current: UserData, incoming: UserData): UserData {
  const pick = <T extends { updatedAt: string }>(a: Record<string, T>, b: Record<string, T>) => {
    const out = { ...a };
    for (const [id, item] of Object.entries(b)) if (!out[id] || out[id].updatedAt < item.updatedAt) out[id] = item;
    return out;
  };
  return {
    ...current,
    exercises: pick(current.exercises, incoming.exercises),
    formats: pick(current.formats, incoming.formats),
    blocks: pick(current.blocks, incoming.blocks),
    templates: pick(current.templates, incoming.templates),
    lessons: pick(current.lessons, incoming.lessons),
    favorites: Array.from(new Set([...current.favorites, ...incoming.favorites])),
    hidden: Array.from(new Set([...current.hidden, ...incoming.hidden])),
  };
}

function DataCard() {
  const data = useStore((s) => s.data);
  const lib = useLibrary();
  const st = useStore.getState();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<UserData | null>(null);
  const [wipe, setWipe] = React.useState(false);
  const hidden = data.hidden;
  const counts = {
    lessen: Object.values(data.lessons).filter((l) => !l.deletedAt).length,
    eigen: Object.keys(data.exercises).length + Object.keys(data.formats).length + Object.keys(data.blocks).length + Object.keys(data.templates).length,
  };
  const name = (key: string) => {
    const [kind, ...rest] = key.split(":");
    const item = SEED_BY_KIND[kind as keyof typeof SEED_BY_KIND]?.get(rest.join(":"));
    return item ? ("name" in item ? item.name : item.title) : key;
  };
  return (
    <Card>
      <p className="text-[14px] text-muted">
        {counts.lessen} lessen · {counts.eigen} eigen of aangepaste bibliotheekitems · {lib.exercises.length} oefeningen en {lib.formats.length} formats in de bibliotheek
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => downloadFile(`fightlab-backup-${new Date().toISOString().slice(0, 10)}.json`, backupToJson(data))} data-testid="backup-download">
          <Download /> Back-up downloaden
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload /> Importeren
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const res = parseImport(await file.text());
            if (!res.ok) return toast(res.error, { tone: "error" });
            if (res.kind === "lesson") {
              const exists = Boolean(st.data.lessons[res.lesson.id]);
              const lesson = exists ? duplicateLesson(res.lesson, res.lesson.title) : res.lesson;
              st.createLesson(lesson, true);
              toast(`Les ‘${lesson.title}’ geïmporteerd`);
            } else setPending(res.data);
          }}
        />
      </div>
      {pending && (
        <div className="mt-3 rounded-lg bg-subtle p-3 text-[14px]">
          <p>Back-up met {Object.keys(pending.lessons).length} lessen gevonden. Hoe wil je importeren?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => { st.replaceData(mergeBackup(st.data, pending), { markAllDirty: true }); setPending(null); toast("Back-up samengevoegd"); }}>Samenvoegen</Button>
            <Button size="sm" variant="secondary" onClick={() => { st.replaceData({ ...pending, prefs: st.data.prefs }, { markAllDirty: true }); setPending(null); toast("Back-up teruggezet"); }}>Alles vervangen</Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Annuleren</Button>
          </div>
        </div>
      )}
      {hidden.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[14px] font-medium"><EyeOff className="size-4 text-faint" /> {hidden.length} verborgen ingebouwde items</p>
          <ul className="mt-1 text-[13px] text-muted">
            {hidden.slice(0, 8).map((h) => (
              <li key={h} className="flex items-center justify-between py-0.5">
                <span className="truncate">{name(h)}</span>
                <button type="button" className="font-medium text-accent" onClick={() => st.unhide([h])}>Terugzetten</button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-1" onClick={() => st.unhide()}>Alles terugzetten</Button>
        </div>
      )}
      <div className="mt-4 border-t border-line pt-3">
        <Button variant="dangerGhost" size="sm" onClick={() => setWipe(true)}>
          <Trash2 /> Lokale gegevens wissen
        </Button>
      </div>
      <Confirm
        open={wipe}
        onOpenChange={setWipe}
        title="Lokale gegevens wissen?"
        description="Alle lessen en eigen items op dit apparaat worden verwijderd. Gegevens in je Supabase-account blijven bestaan. Maak eerst een back-up als je twijfelt."
        confirmLabel="Wissen"
        onConfirm={() => {
          try {
            localStorage.removeItem("fightlab:data:v1");
            localStorage.removeItem("fightlab:outbox:v1");
            localStorage.removeItem("fightlab:meta:v1");
          } catch {
            /* noop */
          }
          window.location.reload();
        }}
      />
    </Card>
  );
}

function AboutCard() {
  return (
    <Card>
      <p className="font-medium">Nummering</p>
      <ul className="mt-1 grid grid-cols-2 gap-x-4 text-[14px] text-muted">
        {Object.entries(STRIKE_NUMBERS).map(([n, label]) => (
          <li key={n}>
            <span className="inline-block w-6 font-semibold text-ink tabular">{n}</span>
            {label}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 font-medium">
        <Smartphone className="size-4 text-faint" /> Op je iPhone als app
      </p>
      <ol className="mt-1 list-decimal pl-5 text-[14px] text-muted">
        <li>Open FightLab in Safari.</li>
        <li>Tik op het deelicoon (vierkant met pijl omhoog).</li>
        <li>Kies ‘Zet op beginscherm’ en tik op ‘Voeg toe’.</li>
      </ol>
      <p className="mt-4 text-xs text-faint">FightLab · basisbibliotheek v1 · gegevens blijven van jou: exporteer altijd een back-up via ‘Gegevens’.</p>
    </Card>
  );
}
