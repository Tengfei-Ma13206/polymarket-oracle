import Anthropic from "@anthropic-ai/sdk";
import type { PolymarketMarket, Verdict } from "./types";

const SYSTEM_PROMPT = `You are Polymarket Oracle — an AI analyst that interprets real prediction market data to answer user questions.

Your job:
1. Analyze the prediction markets provided (these are real, live markets with real money at stake)
2. Answer the user's question based on what the collective wisdom of prediction market traders says
3. Give a direct, opinionated verdict backed by the data

Rules:
- Ground every claim in specific market probabilities — say "traders give this a 72% chance" not vague phrases
- Be direct, concise, and honest — prediction markets are powerful signals, not guarantees
- If markets show low probability of a bad outcome, say so clearly and confidently
- If markets show high risk, say so clearly and urge caution
- Do NOT give investment or financial advice
- Do NOT give medical advice
- Keep total response under 400 words
- Use short paragraphs, not bullet points
- Write in a confident, analyst tone — like a senior strategist briefing a decision-maker

End your response with EXACTLY this line (one of four options):
VERDICT: BULLISH
VERDICT: BEARISH
VERDICT: UNCERTAIN
VERDICT: MIXED

BULLISH = markets signal a positive/safe/favorable outcome for the user's situation
BEARISH = markets signal a negative/risky/unfavorable outcome
UNCERTAIN = insufficient signal or probabilities near 50/50
MIXED = meaningful positive AND negative signals present`;

function formatMarkets(markets: PolymarketMarket[]): string {
  if (markets.length === 0) {
    return "No directly relevant Polymarket prediction markets were found for this question.";
  }

  return markets
    .map(
      (m, i) =>
        `${i + 1}. "${m.question}"
   YES: ${(m.yesPrice * 100).toFixed(1)}%  |  NO: ${(m.noPrice * 100).toFixed(1)}%
   Volume: $${m.volume.toLocaleString()}  |  Ends: ${m.endDate || "open"}`
    )
    .join("\n\n");
}

export function buildUserMessage(question: string, markets: PolymarketMarket[]): string {
  const noMarkets = markets.length === 0;
  return `User question: "${question}"

${noMarkets ? "No directly relevant prediction markets were found." : `Relevant prediction markets (${markets.length} found, sorted by relevance):\n\n${formatMarkets(markets)}`}

${noMarkets
  ? "Even without direct market evidence, provide the best analysis you can based on general knowledge of what prediction markets typically show for similar topics. Note that no specific markets were found."
  : `Based on these ${markets.length} prediction market(s), analyze what the collective market wisdom says about the user's question. Reference specific probabilities in your analysis.`}

End your response with VERDICT: [BULLISH|BEARISH|UNCERTAIN|MIXED]`;
}

export function extractVerdict(text: string): Verdict {
  const match = text.match(/VERDICT:\s*(BULLISH|BEARISH|UNCERTAIN|MIXED)/i);
  if (match) return match[1].toUpperCase() as Verdict;
  return "UNCERTAIN";
}

export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
}

export async function streamAnalysis(
  question: string,
  markets: PolymarketMarket[],
  onToken: (token: string) => Promise<void>,
  onComplete: (fullText: string) => Promise<void>
): Promise<void> {
  const client     = createAnthropicClient();
  const userMessage = buildUserMessage(question, markets);

  let fullText = "";

  const stream = await client.messages.stream({
    model:      "claude-sonnet-4-6",
    max_tokens: 600,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const token = event.delta.text;
      fullText += token;
      await onToken(token);
    }
  }

  await onComplete(fullText);
}
