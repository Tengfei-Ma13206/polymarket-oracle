import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Polymarket Oracle — AI-powered prediction market analysis",
  description: "Ask anything about the future. Get instant analysis powered by Polymarket prediction markets and Claude AI.",
  keywords:    ["polymarket", "prediction markets", "AI analysis", "oracle", "forecasting"],
  openGraph: {
    title:       "Polymarket Oracle",
    description: "Ask anything. Get prediction market intelligence powered by AI.",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Polymarket Oracle",
    description: "Ask anything. Get prediction market intelligence powered by AI.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-mesh min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
