import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Zentai — Market Intelligence",
  description:
    "A source-aware market intelligence workspace. Company research, news, risk analytics, and portfolio tools.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
