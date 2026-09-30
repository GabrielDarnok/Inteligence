"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    // Remove protocol and trailing slash if user pastes a full URL
    let cleanQuery = query.trim();
    if (cleanQuery.startsWith("http://") || cleanQuery.startsWith("https://")) {
      cleanQuery = cleanQuery.replace(/^https?:\/\//, "");
    }
    if (cleanQuery.endsWith("/")) {
      cleanQuery = cleanQuery.slice(0, -1);
    }
    
    router.push(`/indicator/${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative max-w-2xl mx-auto w-full group"
    >
      <div className="absolute inset-0 bg-[#06B6D4]/5 rounded-2xl blur-xl group-hover:bg-[#06B6D4]/10 transition-all duration-300 -z-10" />
      <div className="relative flex items-center w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl focus-within:border-[#06B6D4]/50 transition-colors">
        <div className="pl-5 pr-3 text-slate-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search IPv4, IPv6, Domain, URL, MD5, SHA256..."
          className="w-full bg-transparent border-none outline-none py-4 text-white placeholder:text-slate-500 font-mono text-[13px] search-input"
          autoFocus
        />
        <div className="pr-3 pl-2">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/20 text-[#06B6D4] px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
          </button>
        </div>
      </div>
    </form>
  );
}
