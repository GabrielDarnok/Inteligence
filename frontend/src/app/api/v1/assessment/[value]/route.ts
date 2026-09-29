import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> }
) {
  const { value: encodedValue } = await params;
  const value = decodeURIComponent(encodedValue);
  const supabase = getSupabaseAdmin();

  const { data: indicator, error: indicatorError } = await supabase
    .from("indicators")
    .select("id, type, value")
    .eq("value", value)
    .single();

  if (indicatorError || !indicator) {
    return NextResponse.json(
      { error: "Indicator not found" },
      { status: 404 }
    );
  }

  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("indicator_id", indicator.id)
    .single();

  if (!assessment) {
    return NextResponse.json({
      indicator: indicator.value,
      type: indicator.type,
      assessment: null,
      message: "No assessment available for this indicator yet."
    });
  }

  return NextResponse.json({
    indicator: indicator.value,
    type: indicator.type,
    ...assessment
  });
}
