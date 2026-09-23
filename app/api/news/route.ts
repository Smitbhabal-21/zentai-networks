import { NextRequest, NextResponse } from "next/server";
import { companies } from "@/lib/companies";
import { getNews } from "@/lib/feeds";
export const maxDuration = 30;
export async function GET(req: NextRequest) {
  const company = companies.find(
    (c) => c.ticker === (req.nextUrl.searchParams.get("symbol") || "AAPL"),
  );
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
