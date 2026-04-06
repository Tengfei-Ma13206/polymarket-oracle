"use client";

import { useState, useRef, useCallback } from "react";
import type { AnalysisState, PolymarketMarket, Verdict } from "@/lib/types";

const INITIAL_STATE: AnalysisState = {
  phase:         "idle",
  statusMessage: "",
  markets:       [],
  analysisText:  "",
  verdict:       null,
  error:         null,
};

export function useOracleStream() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const analyze = useCallback(async (question: string) => {
    // Cancel any in-flight request
    if (readerRef.current) {
      await readerRef.current.cancel().catch(() => {});
      readerRef.current = null;
    }

    setState({
      phase:         "fetching",
      statusMessage: "Starting...",
      markets:       [],
      analysisText:  "",
      verdict:       null,
      error:         null,
    });

    let response: Response;
    try {
      response = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question }),
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        phase: "error",
        error: err instanceof Error ? err.message : "Network error",
      }));
      return;
    }

    if (!response.ok || !response.body) {
      setState((s) => ({
        ...s,
        phase: "error",
        error: `Server error: ${response.status}`,
      }));
      return;
    }

    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = "";

    const processLine = (line: string) => {
      if (line.startsWith("event: ")) {
        // handled by pairing with data line below
        return;
      }
    };

    try {
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let eventType = "";
          let dataStr   = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (!eventType || !dataStr) continue;

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(dataStr);
          } catch {
            continue;
          }

          switch (eventType) {
            case "status":
              setState((s) => ({
                ...s,
                phase:         payload.phase as AnalysisState["phase"] ?? s.phase,
                statusMessage: payload.message as string ?? "",
              }));
              break;

            case "markets":
              setState((s) => ({
                ...s,
                markets: (payload.markets as PolymarketMarket[]) ?? [],
              }));
              break;

            case "analysis":
              setState((s) => ({
                ...s,
                analysisText: s.analysisText + (payload.token as string ?? ""),
              }));
              break;

            case "done":
              setState((s) => ({
                ...s,
                phase:   "done",
                verdict: (payload.verdict as Verdict) ?? "UNCERTAIN",
              }));
              break;

            case "error":
              setState((s) => ({
                ...s,
                phase: "error",
                error: (payload.message as string) ?? "Unknown error",
              }));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setState((s) => ({
          ...s,
          phase: "error",
          error: err instanceof Error ? err.message : "Stream error",
        }));
      }
    } finally {
      readerRef.current = null;
    }
  }, []);

  return { state, analyze, reset };
}
