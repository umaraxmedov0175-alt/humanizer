import type { Metadata } from "next";
import "./globals.css";
import "./ai.css";

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(vercelHost ? `https://${vercelHost}` : "http://localhost:3000"),
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
  return <html lang="en"><body>{children}</body></html>;
}
