import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/SearchBar";
import StatsBar from "@/components/StatsBar";
import RecentIndicators from "@/components/RecentIndicators";
import { Shield, Zap, Database, Globe } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [indicators, sources, evidence] = await Promise.all([
    supabase.from("indicators").select("id", { count: "exact", head: true }),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
  ]);

  return {
    indicators: indicators.count ?? 0,
    sources: sources.count ?? 0,
    evidence: evidence.count ?? 0,
  };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-6 pt-12 pb-8 fade-in text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#06B6D4]/20 bg-[#06B6D4]/5 text-[#06B6D4] text-xs font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] pulse-dot" />
          SOC Dashboard
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          <span className="gradient-text-cyan">Global Threat Radar</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Aggregating and normalizing malicious IPs, botnet C2s, and attack observations from top global intelligence feeds in real-time.
        </p>
      </section>

      {/* Stats */}
      <section className="fade-in fade-in-delay-1">
        <StatsBar stats={stats} />
      </section>

      {/* Search */}
      <section className="fade-in fade-in-delay-2">
        <SearchBar />
      </section>

      {/* Recent indicators */}
      <section className="fade-in fade-in-delay-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] px-4 py-3.5 sm:px-6 mb-4">
          <div>
            <h1 className="text-sm font-semibold text-slate-100">Known malicious indicators</h1>
            <p className="mt-0.5 text-[11px] text-slate-600">Recently updated across all families</p>
          </div>
        </div>
        <RecentIndicators />
      </section>
    </div>
  );
}
