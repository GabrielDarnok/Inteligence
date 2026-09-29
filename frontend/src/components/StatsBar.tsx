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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Indicators
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatNumber(stats.indicators)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Evidence Records
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatNumber(stats.evidence)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Database className="w-5 h-5 text-cyan-400" />
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Active Sources
          </p>
          <p className="text-2xl font-bold text-white mt-1">{stats.sources}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <Activity className="w-5 h-5 text-green-400" />
        </div>
      </div>
    </div>
  );
}
