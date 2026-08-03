import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "./ai.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Humanizer — Natural Writing Studio",
  description: "Rewrite with clarity and character while preserving your meaning, facts, and intent.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Humanizer — Natural Writing Studio",
    description: "Make every word sound like you. Meaning first. Voice refined.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Humanizer natural writing studio" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
