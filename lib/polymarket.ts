import type { PolymarketMarket, RawMarket } from "./types";
import { expandKeywords, extractKeywords, scoreMarket } from "./keywords";

const GAMMA_API = "https://gamma-api.polymarket.com";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESULTS_TO_RETURN = 8;

async function fetchMarketsPage(params: Record<string, string | number>): Promise<RawMarket[]> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${GAMMA_API}/markets?${qs}`, {
      signal: controller.signal,
      headers: { "User-Agent": "PolymarketOracle/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseMarket(raw: RawMarket): PolymarketMarket | null {
  try {
    const prices: string[] = typeof raw.outcomePrices === "string"
      ? JSON.parse(raw.outcomePrices)
      : (raw.outcomePrices ?? []);

    const outcomes: string[] = typeof raw.outcomes === "string"
      ? JSON.parse(raw.outcomes)
      : (raw.outcomes ?? []);

    if (!prices || prices.length < 2) return null;

    // Find YES index
    let yesIdx = 0;
    for (let i = 0; i < outcomes.length; i++) {
      if (String(outcomes[i]).toLowerCase().trim() === "yes") {
        yesIdx = i;
        break;
      }
    }
    const noIdx = yesIdx === 0 ? 1 : 0;

    const yesPrice = parseFloat(prices[yesIdx]) || 0;
    const noPrice  = parseFloat(prices[noIdx])  || 0;

    // Skip markets with no meaningful probability signal
    if (yesPrice === 0 && noPrice === 0) return null;

    const endDate = raw.endDateIso || raw.endDate || "";
    const slug    = raw.slug || raw.id || "";

    return {
      id:         raw.id || "",
      question:   raw.question || "",
      slug,
      image:      raw.image || "",
      endDate:    endDate.slice(0, 10),
      yesPrice,
      noPrice,
      volume:     raw.volumeNum    ?? 0,
      volume24h:  raw.volume24hr   ?? 0,
      liquidity:  raw.liquidityNum ?? 0,
      url:        `https://polymarket.com/event/${slug}`,
    };
  } catch {
    return null;
  }
}

export async function fetchAndFilter(question: string): Promise<PolymarketMarket[]> {
  // Three parallel requests: most-traded ever + most-traded recently + next page
  const [batch1, batch2, batch3] = await Promise.all([
    fetchMarketsPage({ limit: 500, order: "volumeNum",  ascending: "false", offset: 0,   closed: "false" }),
    fetchMarketsPage({ limit: 500, order: "volume24hr", ascending: "false", offset: 0,   closed: "false" }),
    fetchMarketsPage({ limit: 500, order: "volumeNum",  ascending: "false", offset: 500, closed: "false" }),
  ]);

  // Deduplicate by id
  const seen  = new Set<string>();
  const all:  RawMarket[] = [];
  for (const raw of [...batch1, ...batch2, ...batch3]) {
    if (!raw.id || seen.has(raw.id)) continue;
    if (raw.closed === true) continue;
    seen.add(raw.id);
    all.push(raw);
  }

  // Score and filter
  const keywords     = extractKeywords(question);
  const expandedTerms = expandKeywords(keywords);

  const scored: Array<{ market: PolymarketMarket; score: number }> = [];
  for (const raw of all) {
    const score = scoreMarket(
      raw.question    ?? "",
      raw.description ?? "",
      expandedTerms
    );
    if (score <= 0) continue;
    const parsed = parseMarket(raw);
    if (!parsed) continue;
    scored.push({ market: { ...parsed, relevanceScore: score }, score });
  }

  // Sort: relevance first, break ties by volume
  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : b.market.volume - a.market.volume
  );

  return scored.slice(0, MAX_RESULTS_TO_RETURN).map((s) => s.market);
}
