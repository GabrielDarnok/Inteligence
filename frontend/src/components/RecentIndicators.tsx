import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Indicator } from "@/lib/types";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function RecentIndicators({ page = 1 }: { page?: number }) {
  const supabase = getSupabaseAdmin();
  const limit = 15;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("indicators")
    .select("*, assessments(active_sources)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return <div className="text-gray-500 text-sm">Failed to load recent indicators.</div>;
  }

  const totalPages = count ? Math.ceil(count / limit) : 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="surface-card flex flex-col min-h-0 overflow-hidden xl:flex-1 mt-6 rounded-lg">
      <div className="overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Indicator</th>
              <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Type</th>
              <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Risk Level</th>
              <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Sources</th>
              <th className="px-5 py-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Threat Vector</th>
              <th className="px-5 py-3 text-right text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.05em]">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {data.map((indicator: any) => {
              const activeSources = Array.isArray(indicator.assessments) 
                ? indicator.assessments[0]?.active_sources || []
                : indicator.assessments?.active_sources || [];

              return (
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
                    <div className="flex flex-wrap gap-1">
                      {activeSources.length > 0 ? (
                        activeSources.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 capitalize text-[10px]">
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-tertiary)]">-</span>
                      )}
                      {activeSources.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] text-[var(--text-tertiary)]">
                          +{activeSources.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-[var(--text-secondary)]">
                    <div className="flex flex-wrap gap-2">
                      {indicator.threat_types?.slice(0, 3).map((t: string) => (
                        <span key={t} className="capitalize">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[11px] text-[var(--text-secondary)]">
                    {new Date(indicator.updated_at).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-5 py-3">
        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
          Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={hasPrevPage ? `/?page=${page - 1}` : '#'}
            className={`p-1.5 rounded-md border border-[var(--border-color)] transition-colors ${
              hasPrevPage 
                ? 'text-[var(--text-primary)] hover:bg-[var(--border-color)]' 
                : 'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="text-[11px] font-mono text-[var(--text-secondary)] px-2">
            Page {page} of {totalPages}
          </div>
          <Link
            href={hasNextPage ? `/?page=${page + 1}` : '#'}
            className={`p-1.5 rounded-md border border-[var(--border-color)] transition-colors ${
              hasNextPage 
                ? 'text-[var(--text-primary)] hover:bg-[var(--border-color)]' 
                : 'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed pointer-events-none'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
