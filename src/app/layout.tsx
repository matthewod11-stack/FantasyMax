import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typography System - FantasyMax Design Language
 *
 * Bebas Neue: Display font for headlines, stats, and impact text
 * - Bold, condensed, all-caps aesthetic
 * - Evokes sports broadcast graphics (ESPN, NFL Network)
 *
 * DM Sans: Body font for readable content
 * - Clean, modern, highly legible
 * - Works well at small sizes for stats tables
 *
 * DM Mono: Monospace for tabular data alignment
 * - Ensures numbers align in columns
 * - Used for scores, records, point totals
 */

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FantasyMax",
  description: "Fantasy football league history and social platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
