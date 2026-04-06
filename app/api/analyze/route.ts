import { fetchAndFilter } from "@/lib/polymarket";
import { streamAnalysis, extractVerdict } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  );
}

export async function POST(req: Request) {
  let question: string;
  try {
    const body = await req.json();
    question = (body.question ?? "").trim();
    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  // Run the pipeline asynchronously so we can return the stream immediately
  (async () => {
    try {
      // Phase 1: fetch markets
      await writer.write(
        sseChunk("status", { phase: "fetching", message: "Scanning Polymarket prediction markets..." })
      );

      const markets = await fetchAndFilter(question);

      await writer.write(
        sseChunk("status", {
          phase:   "filtering",
          message: markets.length > 0
            ? `Found ${markets.length} relevant market${markets.length !== 1 ? "s" : ""}`
            : "No direct markets found — using general analysis",
        })
      );

      // Emit market data so UI can render cards immediately
      await writer.write(sseChunk("markets", { markets }));

      // Phase 2: stream AI analysis
      await writer.write(
        sseChunk("status", { phase: "streaming", message: "Claude is analyzing the markets..." })
      );

      let fullText = "";

      await streamAnalysis(
        question,
        markets,
        async (token) => {
          await writer.write(sseChunk("analysis", { token }));
        },
        async (text) => {
          fullText = text;
        }
      );

      const verdict = extractVerdict(fullText);
      await writer.write(sseChunk("done", { verdict }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await writer.write(sseChunk("error", { message })).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
