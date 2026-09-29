import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/SearchBar";
import StatsBar from "@/components/StatsBar";
import RecentIndicators from "@/components/RecentIndicators";
import { Shield, Zap, Database, Globe } from "lucide-react";

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
      <section className="text-center space-y-6 pt-8 pb-4 fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-300 text-xs font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot" />
          Open Source · Free · Community Driven
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Open Threat Intelligence</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
          Search IPs, domains, URLs, and hashes across multiple public threat
          intelligence sources — unified, normalized, and free.
        </p>
      </section>

      {/* Search */}
      <section className="fade-in fade-in-delay-1">
        <SearchBar />
      </section>

      {/* Stats */}
      <section className="fade-in fade-in-delay-2">
        <StatsBar stats={stats} />
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 fade-in fade-in-delay-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass rounded-xl p-5 space-y-3 hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <f.icon className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{f.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Recent indicators */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Recently Updated
        </h2>
        <RecentIndicators />
      </section>
    </div>
  );
}
