import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: encodedType } = await params;
  const threatType = decodeURIComponent(encodedType).toLowerCase();
  const supabase = getSupabaseAdmin();
  
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam) || 50, 1000) : 50;
  
  const sourcesParam = url.searchParams.get("sources");
  let sourceIds: string[] = [];
  
  if (sourcesParam) {
    const slugs = sourcesParam.split(",").map(s => s.trim().toLowerCase());
    const { data: sourcesData } = await supabase.from("sources").select("id, slug").in("slug", slugs);
    if (sourcesData && sourcesData.length > 0) {
      sourceIds = sourcesData.map(s => s.id);
    } else {
      // If requested sources don't exist, return empty array immediately
      return NextResponse.json([]);
    }
  }

  // Fetch evidence with matching threat_type
  let query = supabase
    .from("evidence")
    .select(`
      threat_type,
      first_seen,
      last_seen,
      indicators (
        value,
        type
      ),
      sources (
        name,
        slug
      )
    `)
    .eq("is_active", true)
    .eq("threat_type", threatType)
    .order("last_seen", { ascending: false });
    
  if (sourceIds.length > 0) {
    query = query.in("source_id", sourceIds);
  }
  
  const { data: evidences, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  // Deduplicate by indicator value
  const resultsMap = new Map();
  for (const ev of evidences || []) {
    if (!ev.indicators) continue;
    const val = (ev.indicators as any).value;
    if (!resultsMap.has(val)) {
      resultsMap.set(val, {
        value: val,
        type: (ev.indicators as any).type,
        threat_type: ev.threat_type,
        first_seen: ev.first_seen,
        last_seen: ev.last_seen,
        sources: [(ev.sources as any)?.name].filter(Boolean)
      });
    } else {
      const existing = resultsMap.get(val);
      const sourceName = (ev.sources as any)?.name;
      if (sourceName && !existing.sources.includes(sourceName)) {
        existing.sources.push(sourceName);
      }
    }
  }

  return NextResponse.json(Array.from(resultsMap.values()));
}
