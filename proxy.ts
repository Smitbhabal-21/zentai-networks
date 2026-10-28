import { NextRequest, NextResponse } from "next/server";

// A fresh nonce lets Next.js hydrate without permitting arbitrary inline scripts.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const supabaseOrigin = (() => {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
      return url.protocol === "https:" ? url.origin : "";
    } catch { return ""; }
  })();
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src-elem 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
};
