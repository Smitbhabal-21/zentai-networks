import { NextRequest, NextResponse } from "next/server";
import { getIvvUniverse } from "@/lib/ivv-universe";
import { getQuote } from "@/lib/feeds";
import { ranges, type Range } from "@/lib/companies";

export const maxDuration = 30;
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  const range = req.nextUrl.searchParams.get("range") || "3mo";
  if (!/^[A-Z0-9-]{1,12}$/.test(symbol)) return NextResponse.json({ error: "Invalid symbol." }, { status: 400 });
  if (!ranges.includes(range as Range)) return NextResponse.json({ error: "Invalid range." }, { status: 400 });
  const universe = await getIvvUniverse();
  if (!universe.holdings.some(item => item.ticker === symbol)) return NextResponse.json({ error: "Symbol is outside this IVV holdings universe." }, { status: 400 });
  try {
    const quote = await getQuote(symbol, range as Range);
    return NextResponse.json({ quote }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } });
  } catch {
    return NextResponse.json({ error: "The chart provider could not return this symbol." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
