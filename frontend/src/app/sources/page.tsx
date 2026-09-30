import { getSupabaseAdmin } from "@/lib/supabase";
import { Source } from "@/lib/types";
import { ExternalLink, Database, Clock, ShieldAlert } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  const supabase = getSupabaseAdmin();
  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .order("name");

  if (error || !sources) {
    return <div className="text-gray-500">Failed to load sources.</div>;
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="space-y-2 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white">Active Data Sources</h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Shadow Inteligence aggregates live threat intelligence from the following public feeds and communities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source: Source) => (
          <div key={source.id} className="glass-card p-6 flex flex-col h-full glass-hover transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  {source.name}
                  {!source.is_active && (
                    <span className="badge-neutral">Inactive</span>
                  )}
                </h2>
                <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">{source.description}</p>
              </div>
              <a
                href={source.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#06B6D4] transition-colors"
                title="Visit Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex-grow space-y-6">
              <div className="flex flex-wrap gap-2">
                {source.supported_indicator_types.map((t) => (
                  <span key={t} className="rounded border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[10px] font-mono text-slate-400">
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <p className="text-slate-500 mb-1 font-medium">License</p>
                  <p className="text-slate-300">{source.license}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1 font-medium">Frequency</p>
                  <p className="text-slate-300 capitalize">{source.update_frequency}</p>
                </div>
              </div>
            </div>

            {/* Sync Status Footer */}
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {source.last_sync_at ? new Date(source.last_sync_at).toLocaleString() : "Never"}
                </span>
              </div>
              {source.last_sync_records_fetched !== null && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-[#06B6D4] font-semibold">{source.last_sync_records_fetched} records</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
