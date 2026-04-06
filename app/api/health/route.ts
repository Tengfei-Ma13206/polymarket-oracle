/**
 * Health check endpoint — visit /api/health to diagnose configuration issues.
 * Returns JSON with status of each dependency.
 */
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Check env var
  const apiKey =
    process.env.DEEPSEEK_APIKEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.DEEPSEEK_KEY;

  if (!apiKey) {
    checks.deepseek_key = {
      ok:     false,
      detail: "DEEPSEEK_APIKEY environment variable is missing. Add it in Vercel → Settings → Environment Variables.",
    };
  } else {
    checks.deepseek_key = {
      ok:     true,
      detail: `Found (starts with: ${apiKey.slice(0, 8)}...)`,
    };
  }

  // 2. Ping DeepSeek API with a minimal non-streaming request
  if (apiKey) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:      "deepseek-chat",
          max_tokens: 5,
          stream:     false,
          messages:   [{ role: "user", content: "hi" }],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      const body = await res.json() as Record<string, unknown>;

      if (res.ok) {
        checks.deepseek_api = {
          ok:     true,
          detail: `Model responded OK (HTTP ${res.status})`,
        };
      } else {
        const errMsg = (body?.error as { message?: string })?.message ?? JSON.stringify(body);
        checks.deepseek_api = {
          ok:     false,
          detail: `HTTP ${res.status}: ${errMsg}`,
        };
      }
    } catch (err) {
      checks.deepseek_api = {
        ok:     false,
        detail: `Network error: ${(err as Error).message}`,
      };
    }
  } else {
    checks.deepseek_api = { ok: false, detail: "Skipped — API key missing" };
  }

  // 3. Check Polymarket reachability
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/markets?limit=1",
      { signal: AbortSignal.timeout(8_000) }
    );
    checks.polymarket = {
      ok:     res.ok,
      detail: res.ok ? `Reachable (HTTP ${res.status})` : `HTTP ${res.status}`,
    };
  } catch (err) {
    checks.polymarket = { ok: false, detail: `Network error: ${(err as Error).message}` };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return Response.json(
    { status: allOk ? "ok" : "degraded", checks },
    { status: allOk ? 200 : 500 }
  );
}
