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

export default async function HomePage(props: { searchParams: Promise<{ page?: string }> }) {
  const stats = await getStats();
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.page || "1") || 1);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-4 pt-16 pb-8 fade-in text-center flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          Global Threat Radar
        </h1>
        <p className="text-[var(--text-secondary)] text-[13px] sm:text-sm max-w-xl leading-relaxed">
          Aggregating and normalizing malicious IPs, URLs, and domains from top global intelligence feeds in real-time.
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3.5 sm:px-6 mb-4">
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">Known malicious indicators</h1>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Recently updated across all families</p>
          </div>
        </div>
        <RecentIndicators page={page} />
      </section>
    </div>
  );
}
