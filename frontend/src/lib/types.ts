export type IndicatorType =
  | "ipv4"
  | "ipv6"
  | "cidr"
  | "domain"
  | "url"
  | "md5"
  | "sha1"
  | "sha256"
  | "asn"
  | "certificate";

export interface Source {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string;
  license: string;
  auth_required: boolean;
  update_frequency: string;
  supported_indicator_types: string[];
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_records_fetched: number | null;
  last_sync_records_new: number | null;
}

export interface Indicator {
  id: string;
  value: string;
  type: IndicatorType;
  is_malicious: boolean | null;
  confidence: string | null;
  recommendation: string | null;
  tags: string[];
  threat_types: string[];
  malware_families: string[];
  source_count: number;
  first_seen: string | null;
  last_seen: string | null;
  observation_count: number;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  indicator_id: string;
  source_id: string;
  source_classification: string | null;
  normalized_classification: string | null;
  threat_type: string | null;
  malware_family: string | null;
  source_record_id: string | null;
  source_url: string | null;
  first_seen: string | null;
  last_seen: string | null;
  collected_at: string;
  is_active: boolean;
  raw_data: Record<string, unknown>;
  extra: Record<string, unknown>;
  sources?: Source;
}

export interface Assessment {
  id: string;
  indicator_id: string;
  is_malicious: boolean | null;
  confidence: string | null;
  confidence_score: number | null;
  recommendation: string | null;
  source_count: number;
  active_sources: string[];
  reasons: string[];
  threat_types: string[];
  malware_families: string[];
  first_seen: string | null;
  last_seen: string | null;
  computed_at: string;
}

export interface IndicatorDetail extends Indicator {
  evidence: (Evidence & { sources: Source })[];
  assessment: Assessment | null;
}
