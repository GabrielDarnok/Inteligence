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
      <div className="space-y-2 border-b border-white/[0.055] pb-4">
        <h1 className="text-sm font-semibold text-slate-100 uppercase tracking-widest">Active Data Sources</h1>
        <p className="text-slate-500 text-xs max-w-3xl leading-relaxed">
          Shadow Inteligence aggregates live threat intelligence from the following public feeds and communities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source: Source) => (
          <div key={source.id} className="rounded-md border border-white/[0.08] bg-[#0d131a] p-5 flex flex-col h-full hover:border-[#ef7c68]/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-[13px] font-bold text-slate-100 flex items-center gap-2">
                  {source.name}
                  {!source.is_active && (
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-red-400 border border-red-500/20">Inactive</span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1.5">{source.description}</p>
              </div>
              <a
                href={source.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-[#ef7c68] transition-colors"
                title="Visit Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex-grow space-y-4 mt-2">
              <div className="flex flex-wrap gap-1.5">
                {source.supported_indicator_types.map((t) => (
                  <span key={t} className="rounded border border-white/[0.08] bg-white/[0.025] px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <p className="text-slate-600 mb-0.5">License</p>
                  <p className="font-medium text-slate-300">{source.license}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-0.5">Frequency</p>
                  <p className="font-medium text-slate-300 capitalize">{source.update_frequency}</p>
                </div>
              </div>
            </div>

            {/* Sync Status Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.04] flex flex-wrap gap-3 text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>
                  {source.last_sync_at ? new Date(source.last_sync_at).toLocaleString() : "Never"}
                </span>
              </div>
              {source.last_sync_records_fetched !== null && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Database className="w-3 h-3" />
                  <span className="text-[#ef7c68]">{source.last_sync_records_fetched} records</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
