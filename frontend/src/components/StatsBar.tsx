"use client";

import { Activity, ShieldAlert, Database } from "lucide-react";

interface StatsProps {
  stats: {
    indicators: number;
    sources: number;
    evidence: number;
  };
}

export default function StatsBar({ stats }: StatsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-md border border-white/[0.08] bg-[#0d131a] p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-medium">
            Active Indicators
          </p>
          <p className="text-xl font-mono text-[#ef7c68] mt-1">
            {formatNumber(stats.indicators)}
          </p>
        </div>
        <div className="w-8 h-8 rounded bg-[#ef7c68]/10 flex items-center justify-center border border-[#ef7c68]/20">
          <ShieldAlert className="w-4 h-4 text-[#ef7c68]" />
        </div>
      </div>

      <div className="rounded-md border border-white/[0.08] bg-[#0d131a] p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-medium">
            Threat Observations
          </p>
          <p className="text-xl font-mono text-[#ef7c68] mt-1">
            {formatNumber(stats.evidence)}
          </p>
        </div>
        <div className="w-8 h-8 rounded bg-[#ef7c68]/10 flex items-center justify-center border border-[#ef7c68]/20">
          <Database className="w-4 h-4 text-[#ef7c68]" />
        </div>
      </div>

      <div className="rounded-md border border-white/[0.08] bg-[#0d131a] p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-medium">
            Live Feeds
          </p>
          <p className="text-xl font-mono text-[#ef7c68] mt-1">{stats.sources}</p>
        </div>
        <div className="w-8 h-8 rounded bg-[#ef7c68]/10 flex items-center justify-center border border-[#ef7c68]/20">
          <Activity className="w-4 h-4 text-[#ef7c68]" />
        </div>
      </div>
    </div>
  );
}
