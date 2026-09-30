"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Radar, Swords, ShieldAlert, Terminal } from "lucide-react";

const links = [
  { href: "/", label: "Radar", icon: Radar },
  { href: "/sources", label: "Sources", icon: ShieldAlert },
  { href: "/api-docs", label: "API", icon: Terminal },
  {
    href: "https://github.com/GabrielDarnok/Inteligence",
    label: "GitHub",
    icon: Swords,
    external: true,
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center px-4 sm:px-6">
        <div aria-label="Shadow Intelligence" className="order-1 flex h-14 items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-8 h-8 overflow-hidden rounded-md bg-black">
              <Image src="/logo.jpg" alt="Logo" width={64} height={64} className="scale-[1.8] opacity-90 group-hover:opacity-100 transition-opacity" priority />
            </div>
          </Link>
        </div>
        
        <div className="order-4 flex w-full items-center gap-6 sm:gap-8 border-t border-[var(--border-color)] md:order-3 md:w-auto md:border-t-0 md:ml-12">
          {links.map((link) => {
            const isActive = pathname === link.href;
            
            return link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center text-[12px] font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-12 items-center text-[12px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
