import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecForge - Turn ideas into agent-ready specs",
  description:
    "Paste a screenshot, describe a process, or upload a flow - get back a structured spec (UI components, data model, process flow, success criteria) in the format Cursor, Claude Code, or an Appian dev agent can execute against.",
  openGraph: {
    title: "SpecForge",
    description:
      "Spec-writing is the new architect skill. SpecForge turns rough ideas into agent-ready specs in 30 seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecForge",
    description: "Turn ideas into agent-ready specs in 30 seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
