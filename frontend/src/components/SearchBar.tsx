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
      <div className="relative flex items-center w-full surface-card rounded-lg overflow-hidden focus-within:border-[#444] transition-colors">
        <div className="pl-4 pr-3 text-[var(--text-secondary)]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search IPv4, IPv6, Domain, URL, MD5, SHA256..."
          className="w-full bg-transparent border-none outline-none py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] font-mono text-[13px] search-input"
          autoFocus
        />
        <div className="pr-2 pl-2">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-[#222] hover:bg-[#333] border border-[#333] text-[var(--text-primary)] px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Scan"}
          </button>
        </div>
      </div>
    </form>
  );
}
