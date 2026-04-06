import type { PolymarketMarket } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

interface Props {
  market: PolymarketMarket;
  index: number;
}

export function MarketCard({ market, index }: Props) {
  const delay = `${index * 60}ms`;

  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-slate-700/60 bg-slate-800/50 p-4
                 hover:border-brand-500/50 hover:bg-slate-800 transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10
                 animate-slide-up"
      style={{ animationDelay: delay, animationFillMode: "both" }}
    >
      {/* Question */}
      <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-3 mb-3 group-hover:text-white transition-colors">
        {market.question}
      </p>

      {/* Probability bar */}
      <ProbabilityBar yesPrice={market.yesPrice} />

      {/* Meta row */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
          {formatVolume(market.volume)} vol
        </span>
        {market.endDate && (
          <span>ends {market.endDate}</span>
        )}
        <span className="text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
          polymarket ↗
        </span>
      </div>
    </a>
  );
}
