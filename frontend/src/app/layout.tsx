import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shadow Intelligence",
  description:
    "A live view of threat observations and malicious indicators across the global network.",
  keywords: [
    "threat intelligence",
    "IOC",
    "malware",
    "cybersecurity",
    "OSINT",
  ],
  openGraph: {
    title: "Shadow Intelligence — Threat Intelligence Platform",
    description: "Search threat indicators across multiple public sources",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen selection:bg-[#333] selection:text-[#FFF] bg-[var(--bg-main)] text-[var(--text-primary)] antialiased`}>
        <Navbar />
        <main className="max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t border-[var(--border-color)] mt-16 py-8 text-center text-[11px] text-[var(--text-secondary)]">
          <p>
            Shadow Intelligence &mdash; Live telemetry and Threat Activity Monitor.{" "}
            <a
              href="https://github.com/GabrielDarnok/Inteligence"
              className="text-[#ef7c68] hover:text-[#f1735f] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {" • "}
            <a
              href="/llms.txt"
              className="text-[#ef7c68] hover:text-[#f1735f] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              llms.txt (AI Agents)
            </a>
          </p>
          <p className="mt-1 text-slate-600">
            Data sourced from ThreatFox, URLhaus, Feodo Tracker, AbuseIPDB, Blocklist.de.
          </p>
        </footer>
      </body>
    </html>
  );
}
