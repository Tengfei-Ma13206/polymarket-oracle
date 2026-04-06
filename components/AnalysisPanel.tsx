"use client";

import { useEffect, useRef } from "react";
import type { Verdict } from "@/lib/types";
import { VerdictBadge } from "./VerdictBadge";

interface Props {
  text:        string;
  verdict:     Verdict | null;
  isStreaming: boolean;
}

/** Very light markdown: **bold**, line breaks → <p> */
function renderText(text: string): string {
  // Strip the final VERDICT line from display
  const cleaned = text.replace(/\n?VERDICT:\s*(BULLISH|BEARISH|UNCERTAIN|MIXED)\s*$/i, "").trim();
  // Bold
  const withBold = cleaned.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Paragraphs
  return withBold
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function AnalysisPanel({ text, verdict, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [text]);

  if (!text && !isStreaming) return null;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          AI Analysis
        </h2>
        {verdict && <VerdictBadge verdict={verdict} />}
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-5 md:p-6">
        <div
          className="prose prose-invert prose-sm max-w-none
                     text-slate-300 leading-relaxed
                     [&>p]:mb-3 [&>p:last-child]:mb-0
                     [&_strong]:text-white [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: renderText(text) }}
        />
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 align-middle animate-blink" />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
