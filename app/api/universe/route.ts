import { NextResponse } from "next/server";
import { getIvvUniverse } from "@/lib/ivv-universe";

export const maxDuration = 15;
export async function GET() {
  const universe = await getIvvUniverse();
  return NextResponse.json(universe, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
