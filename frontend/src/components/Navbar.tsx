"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Swords, ShieldAlert } from "lucide-react";

const links = [
  { href: "/", label: "Live", icon: Radar },
  { href: "/api/v1/feeds/malicious-ip.txt", label: "BGP Feed", icon: ShieldAlert, external: true },
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
    <nav className="sticky top-0 z-50 shrink-0 border-b border-white/[0.065] bg-[#080c11]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center px-4 sm:px-6">
        <div aria-label="Shadow Inteligence Activity Monitor" className="order-1 flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
              Shadow Inteligence<span className="font-normal text-slate-500 ml-1">Botnet Activity Monitor</span>
            </span>
          </Link>
        </div>
        
        <div className="order-2 mx-8 hidden h-5 w-px bg-white/[0.07] md:block"></div>
        
        <div className="order-4 flex w-full items-center gap-2 border-t border-white/[0.05] sm:gap-6 md:order-3 md:w-auto md:border-t-0 lg:gap-8">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-1.5 border-b px-0 text-xs sm:gap-2 sm:text-sm font-medium transition-colors sm:px-1 md:h-16 border-transparent text-slate-500 hover:text-slate-300"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="sm:hidden">{link.label}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-11 items-center gap-1.5 border-b px-0 text-xs sm:gap-2 sm:text-sm font-medium transition-colors sm:px-1 md:h-16 ${
                  isActive
                    ? "border-[#ef7c68] text-slate-100"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="sm:hidden">{link.label}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="dashboard-nav-status order-3 ml-auto flex min-h-16 flex-wrap items-center justify-end gap-x-5 gap-y-3 py-3 md:order-4">
          <span className="hidden text-[11px] text-slate-500 sm:inline flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef7c68] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef7c68]"></span>
            </span>
            SYSTEM ONLINE
          </span>
        </div>
      </div>
    </nav>
  );
}
