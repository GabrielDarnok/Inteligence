import { NextResponse } from "next/server";

export async function GET() {
  const content = `# Shadow Inteligence (Global Threat Radar)

Shadow Inteligence is an Open Threat Intelligence Aggregator. It aggregates, normalizes, and scores malicious IPs, URLs, hashes, and domains from top global intelligence feeds (like AbuseIPDB, ThreatFox, Blocklist.de, AlienVault) in real-time.

## API Documentation

The platform provides a public REST API for querying threat intelligence data. The API returns JSON and requires no authentication for read-only access.

### 1. Query Indicator
Search for a specific indicator (IP, domain, hash, URL) to get its aggregated assessment and source evidence.

**Endpoint:** \`GET /api/v1/indicator/[value]\`

**Example Request:**
\`GET /api/v1/indicator/1.1.1.1\`

**Example Response:**
\`\`\`json
{
  "value": "1.1.1.1",
  "type": "ipv4",
  "is_malicious": false,
  "confidence": "low",
  "recommendation": "monitor",
  "threat_types": [],
  "malware_families": [],
  "source_count": 0,
  "evidence": []
}
\`\`\`

### 2. Search by Threat Type
Search for active indicators based on a specific threat type (e.g., malware, c2, scanner, brute force).

**Endpoint:** \`GET /api/v1/threats/[type]\`

**Query Parameters:**
- \`limit\` (number): Optional. Maximum number of results to return (default: 50, max: 1000).
- \`sources\` (string): Optional. Comma-separated list of source slugs to filter by (e.g. abuseipdb,threatfox).

**Example Request:**
\`GET /api/v1/threats/brute force?limit=10&sources=blocklist_de\`

**Example Response:**
\`\`\`json
[
  {
    "value": "103.104.127.56",
    "type": "ipv4",
    "threat_type": "brute force",
    "first_seen": "2026-09-30T12:50:23Z",
    "last_seen": "2026-09-30T12:50:23Z",
    "sources": ["Blocklist.de"]
  }
]
\`\`\`

## Using this API as an Agent
If you are an AI assistant or agent:
1. Always URL-encode the indicator values or threat types when making requests.
2. The timestamps returned are in UTC (ISO 8601 format).
3. Do not poll the API excessively. Use the limit parameter to grab bulk data if needed.
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
