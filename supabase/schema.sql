-- =============================================================================
-- Open Threat Intelligence Aggregator
-- Supabase / PostgreSQL Schema
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =============================================================================
-- SOURCES
-- =============================================================================

create table public.sources (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,           -- e.g. "threatfox", "greynoise"
  name        text not null,                  -- e.g. "ThreatFox"
  description text,
  website     text,
  license     text,
  terms_of_use text,
  auth_required boolean not null default false,
  update_frequency text,                      -- "hourly", "daily", "weekly"
  supported_indicator_types text[] default '{}',
  is_active   boolean not null default true,
  last_sync_at timestamptz,
  last_sync_status text,                      -- "success", "error", "partial"
  last_sync_message text,
  last_sync_records_fetched integer,
  last_sync_records_new integer,
  last_sync_records_updated integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.sources is 'Registered threat intelligence sources (connectors)';

-- =============================================================================
-- INDICATORS
-- =============================================================================

create type indicator_type as enum (
  'ipv4', 'ipv6', 'cidr', 'domain', 'url',
  'md5', 'sha1', 'sha256', 'asn', 'certificate'
);

create table public.indicators (
  id          uuid primary key default uuid_generate_v4(),
  value       text not null,                  -- the raw indicator value
  type        indicator_type not null,
  -- aggregate computed fields (updated by ingestion)
  is_malicious boolean,
  confidence  text,                           -- "low", "medium", "high"
  recommendation text,                        -- "monitor", "block", "allow"
  tags        text[] default '{}',
  threat_types text[] default '{}',           -- "c2", "ddos", "scanner", "botnet", etc.
  malware_families text[] default '{}',
  source_count integer not null default 0,
  first_seen  timestamptz,
  last_seen   timestamptz,
  observation_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- ensure uniqueness per type+value
  unique (type, value)
);

comment on table public.indicators is 'Deduplicated threat indicators (IPs, domains, hashes, etc.)';

-- Full-text search index
create index indicators_value_trgm_idx on public.indicators using gin (value gin_trgm_ops);
create index indicators_type_idx on public.indicators (type);
create index indicators_is_malicious_idx on public.indicators (is_malicious);
create index indicators_last_seen_idx on public.indicators (last_seen desc);
create index indicators_tags_idx on public.indicators using gin (tags);
create index indicators_threat_types_idx on public.indicators using gin (threat_types);

-- =============================================================================
-- EVIDENCE
-- Represents a specific piece of information provided by a source about an indicator
-- =============================================================================

create table public.evidence (
  id                  uuid primary key default uuid_generate_v4(),
  indicator_id        uuid not null references public.indicators(id) on delete cascade,
  source_id           uuid not null references public.sources(id) on delete cascade,
  -- classification
  source_classification text,               -- original value from source (e.g. "botnet_cc")
  normalized_classification text,           -- our normalized value (e.g. "command_and_control")
  threat_type         text,                 -- normalized threat type
  malware_family      text,
  -- provenance
  source_record_id    text,                 -- original record ID from the source
  source_url          text,                 -- URL where this was obtained
  -- temporal
  first_seen          timestamptz,
  last_seen           timestamptz,
  collected_at        timestamptz not null default now(),
  -- expiration
  expires_at          timestamptz,
  is_active           boolean not null default true,
  -- raw payload from source (full original record)
  raw_data            jsonb,
  -- extra normalized fields
  extra               jsonb default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- one record per source per indicator (upsert on conflict)
  unique (indicator_id, source_id, source_record_id)
);

comment on table public.evidence is 'Individual evidence records from each source about an indicator';

create index evidence_indicator_id_idx on public.evidence (indicator_id);
create index evidence_source_id_idx on public.evidence (source_id);
create index evidence_last_seen_idx on public.evidence (last_seen desc);
create index evidence_threat_type_idx on public.evidence (threat_type);
create index evidence_is_active_idx on public.evidence (is_active);

-- =============================================================================
-- OBSERVATIONS
-- Time-series events: each time an indicator is observed
-- =============================================================================

create table public.observations (
  id            uuid primary key default uuid_generate_v4(),
  indicator_id  uuid not null references public.indicators(id) on delete cascade,
  source_id     uuid not null references public.sources(id) on delete cascade,
  observed_at   timestamptz not null,
  observation_type text,                    -- "scan", "ddos", "c2_beacon", "spam", etc.
  details       jsonb default '{}',
  created_at    timestamptz not null default now()
);

comment on table public.observations is 'Individual observation events for temporal analysis';

create index observations_indicator_id_idx on public.observations (indicator_id);
create index observations_observed_at_idx on public.observations (observed_at desc);
create index observations_source_id_idx on public.observations (source_id);

-- =============================================================================
-- RELATIONSHIPS
-- Allows linking indicators to each other
-- =============================================================================

create table public.relationships (
  id              uuid primary key default uuid_generate_v4(),
  from_indicator  uuid not null references public.indicators(id) on delete cascade,
  relationship    text not null,             -- "belongs_to", "resolves_to", "associated_with"
  to_indicator    uuid not null references public.indicators(id) on delete cascade,
  source_id       uuid references public.sources(id),
  confidence      text,
  created_at      timestamptz not null default now(),
  unique (from_indicator, relationship, to_indicator)
);

comment on table public.relationships is 'Relationships between indicators (IP belongs_to ASN, etc.)';

create index relationships_from_idx on public.relationships (from_indicator);
create index relationships_to_idx on public.relationships (to_indicator);

-- =============================================================================
-- ASSESSMENTS
-- Computed aggregated assessment for an indicator (recalculated on each ingest)
-- =============================================================================

create table public.assessments (
  id              uuid primary key default uuid_generate_v4(),
  indicator_id    uuid not null unique references public.indicators(id) on delete cascade,
  is_malicious    boolean,
  confidence      text,                      -- "low", "medium", "high"
  confidence_score numeric(5,4),             -- 0.0 to 1.0
  recommendation  text,                      -- "allow", "monitor", "block"
  source_count    integer not null default 0,
  active_sources  text[] default '{}',
  reasons         jsonb default '[]',        -- list of human-readable reasons
  threat_types    text[] default '{}',
  malware_families text[] default '{}',
  first_seen      timestamptz,
  last_seen       timestamptz,
  computed_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.assessments is 'Aggregated assessment computed from all evidence for an indicator';

-- =============================================================================
-- INGESTION RUNS
-- Log of each connector execution
-- =============================================================================

create table public.ingestion_runs (
  id              uuid primary key default uuid_generate_v4(),
  source_id       uuid not null references public.sources(id) on delete cascade,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text not null default 'running',  -- "running", "success", "error", "partial"
  records_fetched integer,
  records_new     integer,
  records_updated integer,
  records_skipped integer,
  records_error   integer,
  error_message   text,
  log             text,
  created_at      timestamptz not null default now()
);

comment on table public.ingestion_runs is 'Audit log for each connector ingestion run';

create index ingestion_runs_source_id_idx on public.ingestion_runs (source_id);
create index ingestion_runs_started_at_idx on public.ingestion_runs (started_at desc);

-- =============================================================================
-- API KEYS
-- For controlling access to the REST API
-- =============================================================================

create table public.api_keys (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  key_hash    text not null unique,           -- store hash, never the raw key
  key_prefix  text not null,                 -- first 8 chars for display
  is_active   boolean not null default true,
  rate_limit  integer default 1000,          -- requests per hour
  created_at  timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at  timestamptz
);

comment on table public.api_keys is 'API keys for external consumers';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Public read access for indicators, evidence, assessments, sources
alter table public.indicators enable row level security;
alter table public.evidence enable row level security;
alter table public.assessments enable row level security;
alter table public.sources enable row level security;
alter table public.observations enable row level security;
alter table public.relationships enable row level security;

-- Allow anyone to read (this is a public platform)
create policy "Public read indicators" on public.indicators for select using (true);
create policy "Public read evidence" on public.evidence for select using (true);
create policy "Public read assessments" on public.assessments for select using (true);
create policy "Public read sources" on public.sources for select using (true);
create policy "Public read observations" on public.observations for select using (true);
create policy "Public read relationships" on public.relationships for select using (true);

-- Writes only via service_role (ingestion engine)
create policy "Service write indicators" on public.indicators for all using (auth.role() = 'service_role');
create policy "Service write evidence" on public.evidence for all using (auth.role() = 'service_role');
create policy "Service write assessments" on public.assessments for all using (auth.role() = 'service_role');
create policy "Service write sources" on public.sources for all using (auth.role() = 'service_role');
create policy "Service write observations" on public.observations for all using (auth.role() = 'service_role');
create policy "Service write relationships" on public.relationships for all using (auth.role() = 'service_role');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Update updated_at timestamp automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_indicators_updated_at
  before update on public.indicators
  for each row execute procedure update_updated_at_column();

create trigger update_evidence_updated_at
  before update on public.evidence
  for each row execute procedure update_updated_at_column();

create trigger update_sources_updated_at
  before update on public.sources
  for each row execute procedure update_updated_at_column();

create trigger update_assessments_updated_at
  before update on public.assessments
  for each row execute procedure update_updated_at_column();

-- =============================================================================
-- SEED: Initial sources
-- =============================================================================

insert into public.sources (slug, name, description, website, license, auth_required, update_frequency, supported_indicator_types) values
('threatfox', 'ThreatFox', 'IOC database by abuse.ch — C2, malware, botnets', 'https://threatfox.abuse.ch', 'CC0', false, 'daily', array['ipv4','ipv6','domain','url','md5','sha1','sha256']),
('urlhaus', 'URLhaus', 'Malicious URL database by abuse.ch', 'https://urlhaus.abuse.ch', 'CC0', false, 'daily', array['url','domain','ipv4']),
('feodo', 'Feodo Tracker', 'C2 and botnet infrastructure tracker by abuse.ch', 'https://feodotracker.abuse.ch', 'CC0', false, 'daily', array['ipv4','domain']),
('cisa_kev', 'CISA KEV', 'CISA Known Exploited Vulnerabilities catalog', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', 'Public Domain', false, 'daily', array['url']),
('greynoise', 'GreyNoise', 'Internet scanner and noise intelligence', 'https://greynoise.io', 'Commercial (free tier)', true, 'real-time', array['ipv4']),
('shadowserver', 'Shadowserver', 'Security reports — DDoS, botnets, scanners, honeypots', 'https://www.shadowserver.org', 'Free for network operators', true, 'daily', array['ipv4','ipv6','domain','asn']),
('spamhaus', 'Spamhaus', 'Reputation and blocklist service', 'https://www.spamhaus.org', 'Non-commercial free', true, 'real-time', array['ipv4','cidr','domain','asn']);
