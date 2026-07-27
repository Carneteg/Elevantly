import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Elevantly",
  description:
    "En professionell plattform byggd på ärlig, strukturerad substans — grundad profil, nätverk och innehåll.",
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
      <body className="min-h-dvh">
        <a
          href="#huvudinnehall"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-ink)] focus:px-4 focus:py-2 focus:text-white"
        >
          Hoppa till innehåll
        </a>
        <SiteHeader />
        {/* Botten-padding på mobil så innehåll inte döljs av den fasta bottombaren. */}
        <div id="huvudinnehall" className="pb-16 sm:pb-0">
          {children}
        </div>
      </body>
    </html>
  );
}
