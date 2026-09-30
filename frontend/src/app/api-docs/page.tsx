import { Terminal, Copy, Shield, Database, Activity } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation | Shadow Inteligence",
  description: "REST API documentation for Shadow Inteligence threat data.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/indicator/[value]",
    title: "Indicator Lookup",
    description: "Retrieve comprehensive details, raw evidence, and temporal history for a specific threat indicator (IP or Domain).",
    params: [
      { name: "value", type: "string", description: "The IPv4, IPv6, or domain name to query." }
    ],
    response: `{
  "id": "...",
  "value": "82.158.89.252",
  "type": "ipv4",
  "threat_types": ["c2", "malware"],
  "evidence": [...]
}`
  },
  {
    method: "GET",
    path: "/api/v1/assessment/[value]",
    title: "Risk Assessment",
    description: "Get a quick, actionable risk assessment (block, monitor, unknown) and confidence score for an indicator.",
    params: [
      { name: "value", type: "string", description: "The indicator value." }
    ],
    response: `{
  "recommendation": "block",
  "confidence": "high",
  "reasons": [
    "Confirmed C2 infrastructure.",
    "Multiple independent source sightings."
  ],
  "source_count": 3
}`
  },
  {
    method: "GET",
    path: "/api/v1/feeds/[filename]",
    title: "Plaintext Feeds",
    description: "Download raw, ready-to-use threat feeds for direct integration into firewalls, SIEMs, or BGP blackholing.",
    params: [
      { name: "filename", type: "string", description: "Currently supports: malicious-ip.txt" }
    ],
    response: `# Shadow Inteligence Threat Feed
# Generated: 2024-01-01T00:00:00Z
# Format: IP Address
82.158.89.252
192.168.1.1`
  }
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-12 fade-in max-w-4xl">
      <div className="space-y-4 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[var(--text-secondary)]" />
          API Reference
        </h1>
        <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed max-w-2xl">
          Integrate Shadow Inteligence threat data directly into your security playbooks, firewalls, and SIEMs using our public REST API. No authentication required for basic access.
        </p>
      </div>

      <div className="space-y-10">
        {endpoints.map((endpoint) => (
          <div key={endpoint.path} className="surface-card rounded-lg overflow-hidden border-[var(--border-color)]">
            <div className="border-b border-[var(--border-color)] bg-[#111] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-widest text-[var(--text-primary)] border border-[var(--border-color)]">
                  {endpoint.method}
                </span>
                <code className="text-[12px] text-[var(--text-primary)] font-mono">
                  {endpoint.path}
                </code>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-1">{endpoint.title}</h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{endpoint.description}</p>
              </div>

              {endpoint.params.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.05em] font-medium text-[var(--text-tertiary)] mb-3">Parameters</h4>
                  <div className="border border-[var(--border-color)] rounded-md overflow-hidden">
                    <table className="w-full text-left text-[12px]">
                      <tbody className="divide-y divide-[var(--border-color)] bg-[#0a0a0a]">
                        {endpoint.params.map(p => (
                          <tr key={p.name}>
                            <td className="px-4 py-2 font-mono text-[var(--text-primary)] w-1/4">{p.name}</td>
                            <td className="px-4 py-2 font-mono text-[var(--text-tertiary)] w-1/4">{p.type}</td>
                            <td className="px-4 py-2 text-[var(--text-secondary)]">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.05em] font-medium text-[var(--text-tertiary)] mb-3">Example Response</h4>
                <div className="bg-[#000] border border-[var(--border-color)] rounded-md p-4 overflow-x-auto relative group">
                  <pre className="text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
