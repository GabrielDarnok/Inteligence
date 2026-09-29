import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> }
) {
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
    return NextResponse.json(
      { error: "Indicator not found" },
      { status: 404 }
    );
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
    .select("*, sources(slug, name)")
    .eq("indicator_id", indicator.id)
    .order("last_seen", { ascending: false });

  return NextResponse.json({
    indicator,
    assessment: assessment || null,
    evidence: evidence || [],
  });
}
