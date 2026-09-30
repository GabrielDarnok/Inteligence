# Shadow Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-green.svg)](https://supabase.com/)

An **open source Threat Intelligence aggregation platform** that centralizes information from multiple public, free, and reliable sources into a single unified layer.

## The Problem

An analyst evaluating an IP today must query multiple sources individually — AlienVault, AbuseIPDB, ThreatFox, Blocklist.de — each with its own format, API, terminology, and update frequency.

## The Solution

A single platform that:

1. Automatically collects data from multiple sources in batch
2. Normalizes different formats
3. Deduplicates indicators
4. Correlates information from the same indicator
5. Preserves the origin of each piece of information
6. Provides a REST API and a premium Next.js web interface
7. Includes native AI Agent support (`/llms.txt`)

## Architecture (100% Serverless)

The project is designed to be deployed for free (or very cheap) using modern serverless infrastructure, with no need to maintain Docker containers or virtual machines.

```
GITHUB ACTIONS (Ingestion Engine)
    │  - Python scripts running via Cron
    │  - Fetches data from Threat sources
    │  - Batch processes & writes directly to Supabase
    ▼
SUPABASE (Database)
    │  - PostgreSQL + Row Level Security
    │  - Stores Indicators, Evidence, Assessments
    ▲
    │
VERCEL (Next.js App)
    ├── Frontend UI (Search, Sources, Dashboards)
    └── API Routes (/api/v1/...) for external consumption
```

## Supported Sources (MVP)

| Source | Type | Auth Required |
|---|---|---|
| AlienVault OTX | Pulses, Malware, Scanners | No |
| Blocklist.de | Brute Force, Botnets, Scanners | No |
| ThreatFox (abuse.ch) | IOCs, C2, Malware | No |
| Feodo Tracker (abuse.ch) | C2, Botnets | No |
| URLhaus (abuse.ch) | Malicious URLs | No |

## Supported Indicator Types

- IPv4 / IPv6 / CIDR
- Domain
- URL
- MD5 / SHA1 / SHA256

## Getting Started (Deployment)

### 1. Database (Supabase)

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`.
3. Go to Settings -> API and copy your `Project URL`, `anon public key`, and `service_role secret`.

### 2. Frontend (Vercel)

1. Fork this repository.
2. Create a new project on [Vercel](https://vercel.com/) and link your fork.
3. Set the Root Directory to `frontend`.
4. Add the following Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service_role key
5. Deploy!

### 3. Ingestion Engine (GitHub Actions)

1. Go to your GitHub repository Settings -> Secrets and variables -> Actions.
2. Add the following Repository Secrets:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service_role key
3. The ingestion engine will run automatically on schedule via GitHub Actions.
4. You can also trigger it manually in the Actions tab.

## API & Agent Support

Shadow Intelligence natively supports automated agents (like ChatGPT, Claude, LangChain bots) via the industry standard `llms.txt`. 

If your app is deployed at `inteligence.vercel.app`, agents can read `https://inteligence.vercel.app/llms.txt` to instantly understand the system and interact with the endpoints:

```http
# Fetch an Indicator Assessment
GET https://inteligence.vercel.app/api/v1/indicator/1.1.1.1

# Fetch Latest Threat Types (with optional pagination & source filtering)
GET https://inteligence.vercel.app/api/v1/threats/brute%20force?limit=10&sources=blocklist_de
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — See also [SECURITY.md](SECURITY.md) for responsible disclosure.
