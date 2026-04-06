# 🔮 Polymarket Oracle

> Ask anything about the future. Get instant AI-powered analysis backed by real prediction market data.

**[Live Demo](https://polymarket-oracle.vercel.app)** · Built with [Polymarket](https://polymarket.com) + [Claude AI](https://anthropic.com)

---

## What it does

Users type any question they're curious or worried about — travel safety, geopolitical risk, economic outlook, crypto prices, election odds — and the app:

1. **Scans Polymarket** — searches thousands of real prediction markets with real money at stake
2. **Finds relevant signals** — surfaces the most relevant markets using keyword + synonym expansion
3. **Streams AI analysis** — Claude analyzes the markets and delivers a concise, probability-grounded verdict
4. **Shows a verdict** — Bullish / Bearish / Mixed / Uncertain, backed by crowd wisdom

## Tech stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router, SSE streaming)
- **AI**: [Claude](https://anthropic.com) via `@anthropic-ai/sdk`
- **Data**: [Polymarket Gamma API](https://gamma-api.polymarket.com) (public, no key needed)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Deployment**: [Vercel](https://vercel.com)

## Getting started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Local development

```bash
git clone https://github.com/YOUR_USERNAME/polymarket-oracle
cd polymarket-oracle
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/polymarket-oracle&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key&envLink=https://console.anthropic.com)

### Manual deploy

```bash
npm i -g vercel
vercel
# Set ANTHROPIC_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## Architecture

```
app/
├── page.tsx              # Main UI (client component)
├── api/analyze/route.ts  # SSE streaming endpoint
lib/
├── polymarket.ts         # Market fetching + filtering
├── keywords.ts           # Keyword extraction + synonym expansion
├── claude.ts             # Claude API + prompt builder
├── types.ts              # Shared TypeScript types
hooks/
└── useOracleStream.ts    # SSE consumer hook
components/
├── QueryForm.tsx         # Input + example chips
├── MarketCard.tsx        # Prediction market card
├── AnalysisPanel.tsx     # Streaming AI text
├── VerdictBadge.tsx      # Bullish/Bearish/etc badge
├── ProbabilityBar.tsx    # Animated probability bar
└── LoadingState.tsx      # Bouncing dots loader
```

### SSE streaming protocol

The API route emits events in order:

```
event: status   → { phase, message }
event: markets  → { markets: PolymarketMarket[] }
event: analysis → { token: string }   (one per Claude token)
event: done     → { verdict: "BULLISH"|"BEARISH"|"UNCERTAIN"|"MIXED" }
event: error    → { message: string }
```

## Example questions

- "Should I travel to Japan in May 2026?"
- "Will there be a US recession in 2026?"
- "Is Bitcoin going to reach $200K?"
- "How risky is the Taiwan situation for my investments?"
- "Will there be a ceasefire in Ukraine this year?"
- "What are the odds of a major earthquake in 2026?"

## Disclaimer

Polymarket Oracle is for **informational and entertainment purposes only**. Prediction market probabilities represent crowd estimates, not guarantees. Nothing here is financial, investment, or legal advice.

## License

MIT — see [LICENSE](LICENSE)
