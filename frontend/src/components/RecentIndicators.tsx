import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Indicator } from "@/lib/types";

export default async function RecentIndicators() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("indicators")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error || !data) {
    return <div className="text-gray-500 text-sm">Failed to load recent indicators.</div>;
  }

  return (
    <div className="glass-card latest-scroll min-h-0 overflow-x-auto overflow-y-auto xl:flex-1 mt-6">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
          <tr>
            <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Indicator</th>
            <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Type</th>
            <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Risk Level</th>
            <th className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Threat Vector</th>
            <th className="px-5 py-3 text-right text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {data.map((indicator: Indicator) => (
            <tr
              key={indicator.id}
              className="cursor-pointer border-b border-[var(--border-subtle)] transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-5 py-3 font-mono text-[13px] text-slate-100 group-hover:text-white">
                <Link
                  href={`/indicator/${encodeURIComponent(indicator.value)}`}
                  className="hover:text-[#06B6D4] transition-colors focus-visible:outline-2 focus-visible:outline-[#06B6D4]"
                >
                  {indicator.value}
                </Link>
              </td>
              <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                {indicator.type.toUpperCase()}
              </td>
              <td className="px-5 py-3">
                {indicator.recommendation === "block" ? (
                  <span className="badge-crimson">BLOCK</span>
                ) : indicator.recommendation === "monitor" ? (
                  <span className="badge-amber">MONITOR</span>
                ) : (
                  <span className="badge-neutral">UNKNOWN</span>
                )}
              </td>
              <td className="px-5 py-3 text-[11px] text-slate-300">
                <div className="flex flex-wrap gap-1.5">
                  {indicator.threat_types?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 capitalize text-slate-300"
                    >
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[11px] text-slate-500">
                {new Date(indicator.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })} UTC
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
