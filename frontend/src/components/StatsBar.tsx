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
      <div className="surface-card p-5 flex flex-col gap-2 rounded-lg">
        <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-[0.02em]">
          Active Indicators
        </p>
        <p className="text-2xl tracking-tight font-medium text-[var(--text-primary)]">
          {formatNumber(stats.indicators)}
        </p>
      </div>

      <div className="surface-card p-5 flex flex-col gap-2 rounded-lg">
        <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-[0.02em]">
          Threat Observations
        </p>
        <p className="text-2xl tracking-tight font-medium text-[var(--text-primary)]">
          {formatNumber(stats.evidence)}
        </p>
      </div>

      <div className="surface-card p-5 flex flex-col gap-2 rounded-lg">
        <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-[0.02em]">
          Live Feeds
        </p>
        <p className="text-2xl tracking-tight font-medium text-[var(--text-primary)]">
          {stats.sources}
        </p>
      </div>
    </div>
  );
}
