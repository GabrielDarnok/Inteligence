import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Indicator } from "@/lib/types";

export default async function RecentIndicators() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("indicators")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error || !data) {
    return <div className="text-gray-500 text-sm">Failed to load recent indicators.</div>;
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Indicator</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Assessment</th>
              <th className="px-4 py-3 font-medium">Sources</th>
              <th className="px-4 py-3 font-medium">Threats</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((indicator: Indicator) => (
              <tr
                key={indicator.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/indicator/${encodeURIComponent(indicator.value)}`}
                    className="font-mono text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {indicator.value}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-400 uppercase text-xs">
                  {indicator.type}
                </td>
                <td className="px-4 py-3">
                  {indicator.recommendation === "block" ? (
                    <span className="badge badge-red">Block</span>
                  ) : indicator.recommendation === "monitor" ? (
                    <span className="badge badge-yellow">Monitor</span>
                  ) : (
                    <span className="badge badge-gray">Unknown</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {indicator.source_count}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap max-w-[200px] overflow-hidden">
                    {indicator.threat_types?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                    {indicator.threat_types && indicator.threat_types.length > 2 && (
                      <span className="text-gray-500 text-xs">
                        +{indicator.threat_types.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(indicator.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
