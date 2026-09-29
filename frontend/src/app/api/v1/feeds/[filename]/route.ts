import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename; // e.g., "malicious-ip.txt" or "malicious-ip.json"
  const supabase = getSupabaseAdmin();

  // Very basic implementation: just malicious IPv4s
  const isTxt = filename.endsWith(".txt");
  const isJson = filename.endsWith(".json");
  const isCsv = filename.endsWith(".csv");

  if (!isTxt && !isJson && !isCsv) {
    return NextResponse.json(
      { error: "Unsupported format. Use .txt, .json, or .csv" },
      { status: 400 }
    );
  }

  // Fetch block-worthy indicators
  const { data: assessments, error } = await supabase
    .from("assessments")
    .select(`
      indicator_id,
      indicators ( value, type )
    `)
    .eq("recommendation", "block")
    .limit(10000); // hard limit for now

  if (error || !assessments) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Filter only IPv4 for this specific feed (assuming malicious-ip feed)
  const ips = assessments
    .filter((a: any) => a.indicators.type === "ipv4")
    .map((a: any) => a.indicators.value);

  if (isJson) {
    return NextResponse.json({
      feed: "OTI Malicious IPv4 Blocklist",
      generated_at: new Date().toISOString(),
      count: ips.length,
      indicators: ips,
    });
  }

  if (isTxt) {
    let content = `# OTI Malicious IPv4 Blocklist\n`;
    content += `# Generated: ${new Date().toISOString()}\n`;
    content += `# Count: ${ips.length}\n`;
    content += ips.join("\n");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  if (isCsv) {
    let content = `indicator,type\n`;
    ips.forEach((ip) => {
      content += `${ip},ipv4\n`;
    });

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv",
      },
    });
  }

  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}
