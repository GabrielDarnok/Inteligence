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
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Data Sources</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-3xl leading-relaxed">
          Shadow Inteligence aggregates live threat intelligence from the following public feeds and communities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source: Source) => (
          <div key={source.id} className="surface-card p-6 flex flex-col h-full rounded-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[14px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                  {source.name}
                  {!source.is_active && (
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)] border border-[var(--border-color)] px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </h2>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">{source.description}</p>
              </div>
              <a
                href={source.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                title="Visit Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex-grow space-y-6">
              <div className="flex flex-wrap gap-2">
                {source.supported_indicator_types.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)] bg-[#111] border border-[var(--border-color)] rounded">
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <p className="text-[var(--text-tertiary)] mb-1 font-medium">License</p>
                  <p className="text-[var(--text-secondary)]">{source.license}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)] mb-1 font-medium">Frequency</p>
                  <p className="text-[var(--text-secondary)] capitalize">{source.update_frequency}</p>
                </div>
              </div>
            </div>

            {/* Sync Status Footer */}
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap gap-3 text-[11px] text-[var(--text-tertiary)] font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {source.last_sync_at ? `${new Date(source.last_sync_at).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC` : "Never"}
                </span>
              </div>
              {source.last_sync_records_fetched !== null && (
                <div className="flex items-center gap-1.5 ml-auto text-[var(--text-secondary)]">
                  <Database className="w-3.5 h-3.5" />
                  <span>{source.last_sync_records_fetched} records</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
