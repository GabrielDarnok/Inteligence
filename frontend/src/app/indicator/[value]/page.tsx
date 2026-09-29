import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { IndicatorDetail } from "@/lib/types";
import { ShieldAlert, ArrowLeft, ExternalLink, Calendar, Database, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ value: string }>;
}

export default async function IndicatorPage({ params }: Props) {
  const { value: encodedValue } = await params;
  const value = decodeURIComponent(encodedValue);
  const supabase = getSupabaseAdmin();

  // Fetch indicator
  const { data: indicator, error: indicatorError } = await supabase
    .from("indicators")
    .select("*")
    .eq("value", value)
    .single();

  if (indicatorError || !indicator) {
    notFound();
  }

  // Fetch assessment
  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("indicator_id", indicator.id)
    .single();

  // Fetch evidence with source info
  const { data: evidence } = await supabase
    .from("evidence")
    .select("*, sources(*)")
    .eq("indicator_id", indicator.id)
    .order("last_seen", { ascending: false });

  const detail: IndicatorDetail = {
    ...indicator,
    assessment: assessment || null,
    evidence: (evidence || []) as any,
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 text-sm mb-8">
        <Link
          href="/"
          className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white">
              {detail.value}
            </h1>
            <span className="px-2.5 py-1 rounded bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider">
              {detail.type}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {detail.threat_types?.map((t) => (
              <span key={t} className="badge badge-gray">
                {t}
              </span>
            ))}
            {detail.malware_families?.map((m) => (
              <span key={m} className="badge badge-red">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Assessment Card */}
        {detail.assessment && (
          <div className={`p-5 rounded-xl border w-full md:w-64 shrink-0 ${
            detail.assessment.recommendation === "block" 
              ? "bg-red-500/10 border-red-500/30" 
              : detail.assessment.recommendation === "monitor"
              ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-gray-500/10 border-gray-500/30"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Assessment
            </p>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className={`w-6 h-6 ${
                detail.assessment.recommendation === "block" ? "text-red-400" : "text-yellow-400"
              }`} />
              <span className={`text-2xl font-bold uppercase ${
                detail.assessment.recommendation === "block" ? "text-red-400" : "text-yellow-400"
              }`}>
                {detail.assessment.recommendation}
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <p className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="font-semibold text-white uppercase">{detail.assessment.confidence}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Sources:</span>
                <span className="font-semibold text-white">{detail.assessment.source_count}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Context */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Temporal Activity
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">First Seen</p>
                <p className="font-medium">{detail.first_seen ? new Date(detail.first_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Seen</p>
                <p className="font-medium">{detail.last_seen ? new Date(detail.last_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Observations</p>
                <p className="font-medium">{detail.observation_count}</p>
              </div>
            </div>
          </div>

          {detail.assessment?.reasons && detail.assessment.reasons.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Reasoning
              </h2>
              <ul className="space-y-2 text-sm text-gray-300">
                {detail.assessment.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-500">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col - Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Database className="w-4 h-4" /> Source Evidence ({detail.evidence.length})
          </h2>
          
          <div className="space-y-3">
            {detail.evidence.map((ev) => (
              <div key={ev.id} className="glass rounded-xl p-5 hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{ev.sources?.name}</span>
                    {ev.source_classification && (
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300 font-mono">
                        {ev.source_classification}
                      </span>
                    )}
                  </div>
                  {ev.source_url && (
                    <a 
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                    >
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-4">
                  {ev.threat_type && (
                    <div>
                      <p className="text-gray-500 mb-0.5">Threat Type</p>
                      <p className="font-medium text-gray-300 capitalize">{ev.threat_type.replace(/_/g, " ")}</p>
                    </div>
                  )}
                  {ev.malware_family && (
                    <div>
                      <p className="text-gray-500 mb-0.5">Malware</p>
                      <p className="font-medium text-red-400">{ev.malware_family}</p>
                    </div>
                  )}
                  {ev.first_seen && (
                    <div>
                      <p className="text-gray-500 mb-0.5">First Seen</p>
                      <p className="font-medium text-gray-300">{new Date(ev.first_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                  {ev.last_seen && (
                    <div>
                      <p className="text-gray-500 mb-0.5">Last Seen</p>
                      <p className="font-medium text-gray-300">{new Date(ev.last_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Extra Data */}
                {Object.keys(ev.extra || {}).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 mb-2">Additional Metadata</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(ev.extra || {}).map(([k, v]) => {
                        if (v === null || v === "") return null;
                        return (
                          <div key={k} className="text-xs">
                            <span className="text-gray-500">{k}:</span>{" "}
                            <span className="text-gray-300 font-mono">
                              {Array.isArray(v) ? v.join(", ") : String(v)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
