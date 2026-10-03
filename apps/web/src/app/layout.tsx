import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "GoodHuman",
  description: "Book live artists with clear travel, chat, and protected media.",
  metadataBase: new URL("https://goodhuman.io"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        style={
          {
            "--font-display": "var(--font-display-loaded), Georgia, serif",
            "--font-body": "var(--font-body-loaded), sans-serif",
          } as React.CSSProperties
        }
      >
        <div className="shell">
          <SiteHeader />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
