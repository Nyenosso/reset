"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCopy, FileJson, FileText, Printer } from "lucide-react";
import type { Lesson } from "@/lib/domain/types";
import { copyText, downloadFile, lessonToJson, lessonToMarkdown, lessonToText } from "@/lib/data/export";
import { slugify } from "@/lib/utils/text";
import { toast } from "@/lib/store/ui";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function ExportSheet({ lesson, open, onOpenChange }: { lesson: Lesson; open: boolean; onOpenChange: (v: boolean) => void }) {
  const text = React.useMemo(() => lessonToText(lesson), [lesson]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Exporteren" description="Whiteboard, Notion, notities of PDF" size="md">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={async () => toast((await copyText(text)) ? "Tekst gekopieerd" : "Kopiëren mislukt", { tone: "default" })} data-testid="copy-text">
          <ClipboardCopy /> Kopieer tekst
        </Button>
        <Button variant="secondary" onClick={async () => toast((await copyText(lessonToMarkdown(lesson))) ? "Markdown gekopieerd" : "Kopiëren mislukt")}>
          <FileText /> Kopieer Markdown
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/print/?les=${lesson.id}`}>
            <Printer /> Print / PDF
          </Link>
        </Button>
        <Button variant="secondary" onClick={() => downloadFile(`fightlab-${slugify(lesson.title) || "les"}.json`, lessonToJson(lesson))}>
          <FileJson /> JSON-back-up
        </Button>
      </div>
      <p className="mt-4 mb-1 text-[13px] font-medium text-muted">Voorbeeld whiteboardtekst</p>
      <pre className="max-h-[40dvh] overflow-auto whitespace-pre-wrap rounded-xl bg-subtle/70 p-3 font-mono text-[12.5px] leading-relaxed" data-testid="export-preview">
        {text}
      </pre>
    </Sheet>
  );
}
