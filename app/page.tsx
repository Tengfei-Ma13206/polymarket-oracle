"use client";

import { useRef } from "react";
import { useOracleStream } from "@/hooks/useOracleStream";
import { QueryForm }      from "@/components/QueryForm";
import { MarketCard }     from "@/components/MarketCard";
import { AnalysisPanel }  from "@/components/AnalysisPanel";
import { LoadingState }   from "@/components/LoadingState";

export default function Home() {
  const { state, analyze, reset } = useOracleStream();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (question: string) => {
    analyze(question);
    // Scroll down to results after a short delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  };

  const isActive  = state.phase !== "idle";
  const isLoading = state.phase === "fetching" || state.phase === "filtering";
  const isStreaming = state.phase === "streaming";
  const hasMarkets  = state.markets.length > 0;
  const hasAnalysis = state.analysisText.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" aria-hidden>🔮</span>
            <span className="font-bold text-white text-lg tracking-tight">
              Polymarket Oracle
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-500">
              Powered by{" "}
              <span className="text-brand-400 font-medium">Polymarket</span>
              {" "}+{" "}
              <span className="text-violet-400 font-medium">Claude AI</span>
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 md:py-16 space-y-10">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Ask anything about{" "}
            <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              the future
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Real prediction market data from Polymarket, analyzed by Claude AI.
            Crowd wisdom meets artificial intelligence.
          </p>
        </div>

        {/* ── Query form ── */}
        <QueryForm
          onSubmit={handleSubmit}
          disabled={isActive && state.phase !== "done" && state.phase !== "error"}
        />

        {/* ── Results ── */}
        {isActive && (
          <div ref={resultsRef} className="space-y-8 pt-2">

            {/* Status / loading */}
            {(isLoading || isStreaming) && (
              <LoadingState message={state.statusMessage} />
            )}

            {/* Error */}
            {state.phase === "error" && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300 text-sm animate-fade-in">
                <strong>Error:</strong> {state.error}
                <button
                  onClick={reset}
                  className="ml-4 underline hover:no-underline text-rose-200"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Market cards */}
            {hasMarkets && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Prediction Markets
                  </h2>
                  <span className="text-xs text-slate-600">
                    {state.markets.length} relevant market{state.markets.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.markets.map((m, i) => (
                    <MarketCard key={m.id} market={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* No markets found notice */}
            {!hasMarkets && state.phase !== "fetching" && state.phase !== "idle" && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-4
                              text-slate-500 text-sm text-center animate-fade-in">
                No directly relevant markets found on Polymarket — AI will use general reasoning.
              </div>
            )}

            {/* AI Analysis */}
            {hasAnalysis && (
              <AnalysisPanel
                text={state.analysisText}
                verdict={state.verdict}
                isStreaming={isStreaming}
              />
            )}

            {/* Done — new question CTA */}
            {state.phase === "done" && (
              <div className="text-center pt-2 animate-fade-in">
                <button
                  onClick={reset}
                  className="text-sm text-slate-500 hover:text-white underline
                             underline-offset-2 transition-colors"
                >
                  Ask another question →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {!isActive && (
          <footer className="text-center text-xs text-slate-600 pt-8 space-y-1">
            <p>
              Market data from{" "}
              <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer"
                 className="text-slate-500 hover:text-white transition-colors underline underline-offset-2">
                Polymarket
              </a>
              {" · "}
              Analysis by{" "}
              <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer"
                 className="text-slate-500 hover:text-white transition-colors underline underline-offset-2">
                Claude
              </a>
            </p>
            <p className="text-slate-700">
              Not financial advice · Prediction markets are probabilistic, not certain
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
               0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466
               -.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088
               2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951
               0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65
               0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337
               1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651
               .64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943
               .359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747
               0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
