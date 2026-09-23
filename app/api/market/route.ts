import { NextRequest, NextResponse } from "next/server";
import { allowedSymbols, ranges, type Range } from "@/lib/companies";
import { getQuote } from "@/lib/feeds";
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  const symbols = [
    ...new Set((req.nextUrl.searchParams.get("symbols") || "AAPL").split(",")),
  ];
  const range = req.nextUrl.searchParams.get("range") || "3mo";
  if (
    symbols.length > 14 ||
    symbols.some((s) => !allowedSymbols.has(s)) ||
    !ranges.includes(range as Range)
  )
    return NextResponse.json(
      { error: "Unsupported symbol or chart range." },
      { status: 400 },
    );
  const results = await Promise.allSettled(
    symbols.map((s) => getQuote(s, range as Range)),
  );
  const quotes = results.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );
  const errors = results.flatMap((r, i) =>
    r.status === "rejected"
      ? [
          {
            symbol: symbols[i],
            message: "Quote unavailable from the data provider.",
          },
        ]
      : [],
  );
  return NextResponse.json(
    { quotes, errors, fetchedAt: new Date().toISOString() },
    {
      status: quotes.length ? 200 : 503,
      headers: {
        "Cache-Control": errors.length
          ? "no-store"
          : "public, s-maxage=30, stale-while-revalidate=30",
      },
    },
  );
}
