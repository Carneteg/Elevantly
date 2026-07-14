import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spegeln — Elevantly",
  description:
    "Beskriv vad du faktiskt gjort i jobbet. Spegeln speglar tillbaka vad det säger om vad du är bra på — och vilka roller det pekar mot.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
