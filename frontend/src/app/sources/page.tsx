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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Data Sources</h1>
        <p className="text-gray-400">
          OTI aggregates threat intelligence from the following public sources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((source: Source) => (
          <div key={source.id} className="glass rounded-xl p-6 flex flex-col h-full hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {source.name}
                  {!source.is_active && (
                    <span className="badge badge-gray text-[10px]">Inactive</span>
                  )}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{source.description}</p>
              </div>
              <a
                href={source.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors p-2"
                title="Visit Website"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="flex-grow space-y-4">
              <div className="flex flex-wrap gap-2">
                {source.supported_indicator_types.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-white/10 text-gray-300">
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">License</p>
                  <p className="font-medium text-gray-300">{source.license}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Frequency</p>
                  <p className="font-medium text-gray-300 capitalize">{source.update_frequency}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Authentication</p>
                  <p className="font-medium text-gray-300">{source.auth_required ? "Required" : "None"}</p>
                </div>
              </div>
            </div>

            {/* Sync Status Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Sync: {source.last_sync_at ? new Date(source.last_sync_at).toLocaleString() : "Never"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className={source.last_sync_status === "success" ? "text-green-400" : source.last_sync_status === "error" ? "text-red-400" : ""}>
                  {source.last_sync_status ? source.last_sync_status.toUpperCase() : "UNKNOWN"}
                </span>
              </div>
              {source.last_sync_records_fetched !== null && (
                <div className="flex items-center gap-1.5">
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
