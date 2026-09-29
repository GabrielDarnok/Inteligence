"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const links = [
  { href: "/", label: "Search" },
  { href: "/sources", label: "Sources" },
  { href: "/api/v1/feeds/malicious-ip.txt", label: "Feeds", external: true },
  {
    href: "https://github.com/your-org/open-threat-intelligence-aggregator",
    label: "GitHub",
    external: true,
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-400/50 transition-colors">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            <span className="text-white">OTI</span>
            <span className="text-gray-500 ml-1 font-normal hidden sm:inline">
              Open Threat Intelligence
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors rounded-md hover:bg-white/5"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm transition-colors rounded-md ${
                  pathname === link.href
                    ? "text-white bg-white/8"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
