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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 flex flex-col gap-3 group glass-hover transition-all">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-semibold tracking-[0.2em] uppercase">
            Active Indicators
          </p>
          <div className="w-8 h-8 rounded bg-[#F43F5E]/10 flex items-center justify-center border border-[#F43F5E]/30 group-hover:bg-[#F43F5E]/20 transition-colors">
            <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-white tracking-tight">
          {formatNumber(stats.indicators)}
        </p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-3 group glass-hover transition-all">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-semibold tracking-[0.2em] uppercase">
            Threat Observations
          </p>
          <div className="w-8 h-8 rounded bg-[#06B6D4]/10 flex items-center justify-center border border-[#06B6D4]/30 group-hover:bg-[#06B6D4]/20 transition-colors">
            <Database className="w-4 h-4 text-[#06B6D4]" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-white tracking-tight">
          {formatNumber(stats.evidence)}
        </p>
      </div>

      <div className="glass-card p-6 flex flex-col gap-3 group glass-hover transition-all">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-semibold tracking-[0.2em] uppercase">
            Live Feeds
          </p>
          <div className="w-8 h-8 rounded bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/20 transition-colors">
            <Activity className="w-4 h-4 text-[#F59E0B]" />
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-white tracking-tight">
          {stats.sources}
        </p>
      </div>
    </div>
  );
}
