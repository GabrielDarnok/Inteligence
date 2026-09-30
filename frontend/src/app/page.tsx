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

const features = [
  {
    icon: Database,
    title: "Multi-source",
    desc: "ThreatFox, URLhaus, Feodo, CISA KEV, GreyNoise, Shadowserver",
  },
  {
    icon: Shield,
    title: "Evidence-based",
    desc: "Every data point traces back to its original source",
  },
  {
    icon: Zap,
    title: "REST API",
    desc: "Consume threat data programmatically — feeds, JSON, CSV",
  },
  {
    icon: Globe,
    title: "Open source",
    desc: "Transparent, community-driven, free to use and contribute",
  },
];

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-4 pt-6 pb-2 fade-in">
        <h1 className="text-sm font-semibold text-slate-100 uppercase tracking-widest">
          Live Threat Telemetry
        </h1>
        <p className="text-slate-500 text-xs max-w-3xl leading-relaxed">
          Aggregating and normalizing malicious IPs, botnet C2s, and attack observations from ThreatFox, URLhaus, Feodo Tracker, AbuseIPDB, and Blocklist.de.
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
