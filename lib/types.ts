export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  image: string;
  endDate: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  volume24h: number;
  liquidity: number;
  url: string;
  relevanceScore?: number;
}

export type Verdict = "BULLISH" | "BEARISH" | "UNCERTAIN" | "MIXED";
export type Phase = "idle" | "fetching" | "filtering" | "streaming" | "done" | "error";

export interface AnalysisState {
  phase: Phase;
  statusMessage: string;
  markets: PolymarketMarket[];
  analysisText: string;
  verdict: Verdict | null;
  error: string | null;
}

// SSE payload types
export interface StatusPayload  { phase: string; message: string }
export interface MarketsPayload { markets: PolymarketMarket[] }
export interface AnalysisPayload{ token: string }
export interface DonePayload    { verdict: Verdict; summary: string }
export interface ErrorPayload   { message: string }

// Raw Polymarket Gamma API response shape
export interface RawMarket {
  id: string;
  question: string;
  slug: string;
  image?: string;
  endDate?: string;
  endDateIso?: string;
  outcomePrices?: string;
  outcomes?: string;
  volumeNum?: number;
  volume24hr?: number;
  liquidityNum?: number;
  description?: string;
  active?: boolean;
  closed?: boolean;
}
