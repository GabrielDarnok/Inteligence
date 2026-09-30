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
      <div className="flex items-center gap-4 text-sm mb-6">
        <Link
          href="/"
          className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Radar
        </Link>
      </div>

      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white">
              {detail.value}
            </h1>
            <span className="px-2.5 py-1 rounded border border-white/[0.08] bg-white/[0.02] text-slate-300 text-xs font-mono uppercase tracking-widest">
              {detail.type}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {detail.threat_types?.map((t) => (
              <span key={t} className="badge-neutral">
                {t}
              </span>
            ))}
            {detail.malware_families?.map((m) => (
              <span key={m} className="badge-crimson">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Assessment Card */}
        {detail.assessment && (
          <div className={`p-5 rounded-xl border w-full md:w-64 shrink-0 shadow-lg ${
            detail.assessment.recommendation === "block" 
              ? "bg-[#F43F5E]/10 border-[#F43F5E]/30" 
              : detail.assessment.recommendation === "monitor"
              ? "bg-[#F59E0B]/10 border-[#F59E0B]/30"
              : "bg-slate-500/10 border-slate-500/30"
          }`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Risk Assessment
            </p>
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert className={`w-7 h-7 ${
                detail.assessment.recommendation === "block" ? "text-[#F43F5E]" : "text-[#F59E0B]"
              }`} />
              <span className={`text-2xl font-bold uppercase ${
                detail.assessment.recommendation === "block" ? "text-[#F43F5E]" : "text-[#F59E0B]"
              }`}>
                {detail.assessment.recommendation}
              </span>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <p className="flex justify-between items-center">
                <span className="text-slate-400">Confidence</span>
                <span className="font-mono font-medium text-white">{detail.assessment.confidence}</span>
              </p>
              <p className="flex justify-between items-center">
                <span className="text-slate-400">Sightings</span>
                <span className="font-mono font-medium text-white">{detail.assessment.source_count} feeds</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Context */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#06B6D4]" /> Temporal Activity
            </h2>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">First Seen</p>
                <p className="font-mono text-[13px] text-slate-200">{detail.first_seen ? new Date(detail.first_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Last Seen</p>
                <p className="font-mono text-[13px] text-slate-200">{detail.last_seen ? new Date(detail.last_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Total Observations</p>
                <p className="font-mono text-[13px] text-slate-200">{detail.observation_count}</p>
              </div>
            </div>
          </div>

          {detail.assessment?.reasons && detail.assessment.reasons.length > 0 && (
            <div className="glass-card p-6 border-[#F59E0B]/20">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" /> Reasoning
              </h2>
              <ul className="space-y-3 text-[13px] text-slate-300">
                {detail.assessment.reasons.map((r, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-[#F59E0B] mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col - Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
            <Database className="w-4 h-4 text-[#06B6D4]" /> Source Evidence ({detail.evidence.length})
          </h2>
          
          <div className="space-y-4">
            {detail.evidence.map((ev) => (
              <div key={ev.id} className="glass-card p-6 glass-hover transition-colors">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-[15px]">{ev.sources?.name}</span>
                    {ev.source_classification && (
                      <span className="px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] text-[10px] text-slate-300 font-mono tracking-widest uppercase">
                        {ev.source_classification}
                      </span>
                    )}
                  </div>
                  {ev.source_url && (
                    <a 
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#06B6D4] hover:text-[#22d3ee] flex items-center gap-1.5 text-xs font-medium transition-colors"
                    >
                      View Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-xs">
                  {ev.threat_type && (
                    <div>
                      <p className="text-slate-500 mb-1">Threat Type</p>
                      <p className="font-medium text-slate-200 capitalize">{ev.threat_type.replace(/_/g, " ")}</p>
                    </div>
                  )}
                  {ev.malware_family && (
                    <div>
                      <p className="text-slate-500 mb-1">Malware</p>
                      <p className="font-medium text-[#F43F5E]">{ev.malware_family}</p>
                    </div>
                  )}
                  {ev.first_seen && (
                    <div>
                      <p className="text-slate-500 mb-1">First Seen</p>
                      <p className="font-mono text-slate-300">{new Date(ev.first_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                  {ev.last_seen && (
                    <div>
                      <p className="text-slate-500 mb-1">Last Seen</p>
                      <p className="font-mono text-slate-300">{new Date(ev.last_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Extra Data */}
                {Object.keys(ev.extra || {}).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-3">Additional Metadata</p>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(ev.extra || {}).map(([k, v]) => {
                        if (v === null || v === "") return null;
                        return (
                          <div key={k} className="text-xs bg-black/20 rounded px-2.5 py-1.5 border border-white/[0.03]">
                            <span className="text-slate-500 mr-2">{k}:</span>
                            <span className="text-slate-300 font-mono">
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
