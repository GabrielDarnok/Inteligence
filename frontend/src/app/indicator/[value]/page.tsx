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
      <div className="flex items-center gap-4 text-[13px] mb-4">
        <Link
          href="/"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
      </div>

      <div className="surface-card rounded-lg p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-mono font-medium tracking-tight text-[var(--text-primary)]">
              {detail.value}
            </h1>
            <span className="px-2 py-1 rounded border border-[var(--border-color)] bg-[#111] text-[var(--text-secondary)] text-[11px] font-mono uppercase tracking-widest">
              {detail.type}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {detail.threat_types?.map((t) => (
              <span key={t} className="text-[11px] font-medium text-[var(--text-primary)] uppercase tracking-tight">
                {t}
              </span>
            ))}
            {detail.malware_families?.map((m) => (
              <span key={m} className="text-[11px] font-medium text-[var(--text-primary)] uppercase tracking-tight">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Assessment Card */}
        {detail.assessment && (
          <div className={`p-5 rounded-lg border w-full md:w-64 shrink-0 bg-[var(--bg-surface)] ${
            detail.assessment.recommendation === "block" 
              ? "border-[#442222]" 
              : "border-[var(--border-color)]"
          }`}>
            <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2">
              Assessment
            </p>
            <div className="flex items-center gap-2 mb-5">
              <span className={`text-xl font-medium uppercase tracking-tight ${
                detail.assessment.recommendation === "block" ? "text-[#FF8888]" : "text-[var(--text-primary)]"
              }`}>
                {detail.assessment.recommendation}
              </span>
            </div>
            
            <div className="space-y-2 text-[12px]">
              <p className="flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">Confidence</span>
                <span className="font-mono text-[var(--text-primary)]">{detail.assessment.confidence}</span>
              </p>
              <p className="flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">Sightings</span>
                <span className="font-mono text-[var(--text-primary)]">{detail.assessment.source_count}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Context */}
        <div className="space-y-6">
          <div className="surface-card rounded-lg p-6">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-5">
              Temporal Activity
            </h2>
            <div className="space-y-4 text-[13px]">
              <div>
                <p className="text-[var(--text-tertiary)] mb-1">First Seen</p>
                <p className="font-mono text-[var(--text-secondary)]">{detail.first_seen ? new Date(detail.first_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)] mb-1">Last Seen</p>
                <p className="font-mono text-[var(--text-secondary)]">{detail.last_seen ? new Date(detail.last_seen).toLocaleString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)] mb-1">Total Observations</p>
                <p className="font-mono text-[var(--text-secondary)]">{detail.observation_count}</p>
              </div>
            </div>
          </div>

          {detail.assessment?.reasons && detail.assessment.reasons.length > 0 && (
            <div className="surface-card rounded-lg p-6">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-4">
                Reasoning
              </h2>
              <ul className="space-y-2 text-[13px] text-[var(--text-secondary)]">
                {detail.assessment.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className="text-[var(--text-tertiary)]">—</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col - Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] px-1">
            Source Evidence ({detail.evidence.length})
          </h2>
          
          <div className="space-y-4">
            {detail.evidence.map((ev) => (
              <div key={ev.id} className="surface-card rounded-lg p-6 surface-hover transition-colors">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[var(--text-primary)] text-[14px]">{ev.sources?.name}</span>
                    {ev.source_classification && (
                      <span className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[#111] text-[10px] text-[var(--text-secondary)] font-mono uppercase">
                        {ev.source_classification}
                      </span>
                    )}
                  </div>
                  {ev.source_url && (
                    <a 
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                    >
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-[12px]">
                  {ev.threat_type && (
                    <div>
                      <p className="text-[var(--text-tertiary)] mb-1">Threat Type</p>
                      <p className="text-[var(--text-primary)] capitalize">{ev.threat_type.replace(/_/g, " ")}</p>
                    </div>
                  )}
                  {ev.malware_family && (
                    <div>
                      <p className="text-[var(--text-tertiary)] mb-1">Malware</p>
                      <p className="text-[var(--text-primary)]">{ev.malware_family}</p>
                    </div>
                  )}
                  {ev.first_seen && (
                    <div>
                      <p className="text-[var(--text-tertiary)] mb-1">First Seen</p>
                      <p className="font-mono text-[var(--text-secondary)]">{new Date(ev.first_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                  {ev.last_seen && (
                    <div>
                      <p className="text-[var(--text-tertiary)] mb-1">Last Seen</p>
                      <p className="font-mono text-[var(--text-secondary)]">{new Date(ev.last_seen).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Extra Data */}
                {Object.keys(ev.extra || {}).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
                    <p className="text-[10px] uppercase tracking-[0.05em] font-medium text-[var(--text-tertiary)] mb-3">Metadata</p>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(ev.extra || {}).map(([k, v]) => {
                        if (v === null || v === "") return null;
                        return (
                          <div key={k} className="text-[12px]">
                            <span className="text-[var(--text-tertiary)] mr-2">{k}:</span>
                            <span className="text-[var(--text-secondary)] font-mono">
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
