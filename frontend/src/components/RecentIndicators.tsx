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
    <div className="surface-card min-h-0 overflow-x-auto overflow-y-auto xl:flex-1 mt-6 rounded-lg">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
          <tr>
            <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Indicator</th>
            <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Type</th>
            <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Risk Level</th>
            <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Threat Vector</th>
            <th className="px-5 py-3 text-right text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {data.map((indicator: Indicator) => (
            <tr
              key={indicator.id}
              className="cursor-pointer border-b border-[var(--border-color)] surface-hover transition-colors"
            >
              <td className="px-5 py-3 font-mono text-[12px] text-[var(--text-primary)]">
                <Link
                  href={`/indicator/${encodeURIComponent(indicator.value)}`}
                  className="hover:underline focus-visible:outline-2"
                >
                  {indicator.value}
                </Link>
              </td>
              <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-secondary)]">
                {indicator.type.toUpperCase()}
              </td>
              <td className="px-5 py-3">
                <span className="text-[11px] font-medium text-[var(--text-primary)] uppercase tracking-tight">
                  {indicator.recommendation || "UNKNOWN"}
                </span>
              </td>
              <td className="px-5 py-3 text-[11px] text-[var(--text-secondary)]">
                <div className="flex flex-wrap gap-2">
                  {indicator.threat_types?.slice(0, 3).map((t) => (
                    <span key={t} className="capitalize">
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[11px] text-[var(--text-secondary)]">
                {new Date(indicator.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })} UTC
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
