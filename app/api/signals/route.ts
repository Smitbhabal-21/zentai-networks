import { NextRequest, NextResponse } from "next/server";
import { getIvvUniverse } from "@/lib/ivv-universe";
import { getQuote } from "@/lib/feeds";
import { signalHistory } from "@/lib/signal-map";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const symbols = [...new Set((req.nextUrl.searchParams.get("symbols") || "").split(",").filter(Boolean))];
  if (!symbols.length || symbols.length > 8 || symbols.some(symbol => !/^[A-Z0-9-]{1,12}$/.test(symbol))) {
    return NextResponse.json({ error: "Select 1–8 valid symbols." }, { status: 400 });
  }
  const universe = await getIvvUniverse();
  const allowed = new Set(universe.holdings.map(item => item.ticker));
  if (symbols.some(symbol => !allowed.has(symbol))) {
    return NextResponse.json({ error: "Symbols must belong to the current IVV holdings universe." }, { status: 400 });
  }
  const results = await Promise.all(symbols.map(async symbol => {
    try {
      const quote = await getQuote(symbol, "3mo");
      const signal = signalHistory(quote.history).at(-1);
      return { symbol, score: signal?.score ?? null, state: signal?.state ?? null,
        close: signal?.close ?? null, observedAt: signal?.date ?? null,
        quoteAsOf: quote.asOf, source: quote.source,
        factors: signal?.factors ?? [],
        error: signal ? null : "Fewer than 30 valid observations." };
    } catch {
      return { symbol, score: null, state: null, close: null, observedAt: null,
        quoteAsOf: null, source: null, factors: [], error: "Chart unavailable; retry this company later." };
    }
  }));
  return NextResponse.json({ results, fetchedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" },
  });
}
