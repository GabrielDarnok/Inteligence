import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OTI — Open Threat Intelligence",
  description:
    "Open source threat intelligence aggregator. Search IPs, domains, hashes across ThreatFox, URLhaus, Feodo Tracker, GreyNoise, Shadowserver, CISA KEV and more.",
  keywords: [
    "threat intelligence",
    "IOC",
    "malware",
    "C2",
    "cybersecurity",
    "open source",
  ],
  openGraph: {
    title: "OTI — Open Threat Intelligence",
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
      <body className={`${inter.className} bg-[#0a0e1a] text-gray-100 min-h-screen`}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-white/5 mt-16 py-8 text-center text-sm text-gray-500">
          <p>
            Open Threat Intelligence Aggregator &mdash; Open source, built for the community.{" "}
            <a
              href="https://github.com/your-org/open-threat-intelligence-aggregator"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Data sourced from ThreatFox, URLhaus, Feodo Tracker, CISA KEV, GreyNoise, Shadowserver, Spamhaus. Each source retains its own license and terms.
          </p>
        </footer>
      </body>
    </html>
  );
}
