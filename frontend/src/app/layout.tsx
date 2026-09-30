import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shadow Inteligence",
  description:
    "A live view of attack observations, C2 botnets, and malicious indicators across the global network.",
  keywords: [
    "threat intelligence",
    "IOC",
    "malware",
    "C2",
    "cybersecurity",
    "botnet",
  ],
  openGraph: {
    title: "Shadow Inteligence — Live attack telemetry",
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
      <body className={`${inter.className} bg-[#070a0f] text-slate-100 min-h-screen selection:bg-[#ef7c68]/30 selection:text-white`}>
        <Navbar />
        <main className="dashboard-shell max-w-[1800px] mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t border-white/[0.05] mt-16 py-8 text-center text-[11px] text-slate-500">
          <p>
            Shadow Inteligence &mdash; Live telemetry and Threat Activity Monitor.{" "}
            <a
              href="https://github.com/GabrielDarnok/Inteligence"
              className="text-[#ef7c68] hover:text-[#f1735f] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
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
