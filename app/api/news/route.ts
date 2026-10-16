import { NextRequest, NextResponse } from "next/server";
import { companies } from "@/lib/companies";
import { getNews } from "@/lib/feeds";
import { getIvvUniverse } from "@/lib/ivv-universe";
export const maxDuration = 30;
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "AAPL";
  if (!/^[A-Z0-9-]{1,12}$/.test(symbol)) return NextResponse.json({ error: "Invalid symbol." }, { status: 400 });
  const company = companies.find(c => c.ticker === symbol) || (await getIvvUniverse()).holdings.find(c => c.ticker === symbol);
  if (!company)
    return NextResponse.json(
      { error: "Unsupported company." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await getNews(company.ticker, company.name), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "News provider is unavailable. Try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
