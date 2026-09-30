"""
Ingester: responsible for writing normalized evidence into Supabase.
Handles deduplication, upsert logic, and assessment recomputation.
"""
import structlog
from datetime import datetime
from models import NormalizedEvidence
from db import get_supabase

logger = structlog.get_logger()


class Ingester:
    def __init__(self):
        self.db = get_supabase()
        self._source_cache = {}

    async def ingest(self, evidence: NormalizedEvidence, source_slug: str) -> str:
        """
        Persist one evidence record.
        Returns: "new" | "updated" | "skipped" | "error"
        """
        try:
            source_id = self._get_source_id(source_slug)
            if not source_id:
                logger.warning("Source not found", slug=source_slug)
                return "error"

            indicator_id = self._upsert_indicator(evidence)
            outcome = self._upsert_evidence(evidence, indicator_id, source_id)
            self._upsert_observation(evidence, indicator_id, source_id)
            self._recompute_assessment(indicator_id)
            return outcome

        except Exception as e:
            logger.error("Ingest error", error=str(e), indicator=evidence.indicator_value)
            return "error"

    def _get_source_id(self, slug: str) -> str | None:
        if slug in self._source_cache:
            return self._source_cache[slug]
            
        row = self.db.table("sources").select("id").eq("slug", slug).execute()
        if row.data and len(row.data) > 0:
            self._source_cache[slug] = row.data[0]["id"]
            return self._source_cache[slug]
        return None

    def _upsert_indicator(self, evidence: NormalizedEvidence) -> str:
        row = (
            self.db.table("indicators")
            .upsert(
                {
                    "value": evidence.indicator_value,
                    "type": evidence.indicator_type.value,
                    "first_seen": evidence.first_seen.isoformat() if evidence.first_seen else None,
                    "last_seen": evidence.last_seen.isoformat() if evidence.last_seen else None,
                },
                on_conflict="type,value",
                ignore_duplicates=False,
            )
            .execute()
        )
        return row.data[0]["id"]

    def _upsert_evidence(
        self, evidence: NormalizedEvidence, indicator_id: str, source_id: str
    ) -> str:
        existing = (
            self.db.table("evidence")
            .select("id")
            .eq("indicator_id", indicator_id)
            .eq("source_id", source_id)
            .eq("source_record_id", evidence.source_record_id or "")
            .execute()
        )
        is_new = not existing.data

        payload = {
            "indicator_id": indicator_id,
            "source_id": source_id,
            "source_classification": evidence.source_classification,
            "normalized_classification": evidence.normalized_classification,
            "threat_type": evidence.threat_type,
            "malware_family": evidence.malware_family,
            "source_record_id": evidence.source_record_id or "",
            "source_url": evidence.source_url,
            "first_seen": evidence.first_seen.isoformat() if evidence.first_seen else None,
            "last_seen": evidence.last_seen.isoformat() if evidence.last_seen else None,
            "expires_at": evidence.expires_at.isoformat() if evidence.expires_at else None,
            "raw_data": evidence.raw_data or {},
            "extra": evidence.extra or {},
            "collected_at": datetime.utcnow().isoformat(),
            "is_active": True,
        }

        self.db.table("evidence").upsert(
            payload, on_conflict="indicator_id,source_id,source_record_id"
        ).execute()

        return "new" if is_new else "updated"

    def _upsert_observation(
        self, evidence: NormalizedEvidence, indicator_id: str, source_id: str
    ):
        if evidence.last_seen:
            self.db.table("observations").upsert(
                {
                    "indicator_id": indicator_id,
                    "source_id": source_id,
                    "observed_at": evidence.last_seen.isoformat(),
                    "observation_type": evidence.threat_type,
                    "details": evidence.extra or {},
                },
                on_conflict="indicator_id,source_id,observed_at",
                ignore_duplicates=True,
            ).execute()

    def _recompute_assessment(self, indicator_id: str):
        """
        Recompute aggregated assessment from all active evidence for this indicator.
        Simple rule-based engine — extensible later.
        """
        evidences = (
            self.db.table("evidence")
            .select("*")
            .eq("indicator_id", indicator_id)
            .eq("is_active", True)
            .execute()
        )
        rows = evidences.data or []
        if not rows:
            return

        sources = self.db.table("sources").select("id,slug,name").execute().data or []
        source_map = {s["id"]: s for s in sources}

        threat_types = list({r["threat_type"] for r in rows if r.get("threat_type")})
        malware_families = list({r["malware_family"] for r in rows if r.get("malware_family")})
        active_source_slugs = list({source_map[r["source_id"]]["slug"] for r in rows if r["source_id"] in source_map})
        source_count = len(active_source_slugs)

        # Simple scoring
        is_malicious = source_count >= 1
        score = min(source_count / 5.0, 1.0)
        confidence = "low" if score < 0.4 else "medium" if score < 0.7 else "high"
        recommendation = "monitor" if score < 0.4 else "block"

        # Build human-readable reasons
        reasons = []
        if source_count > 1:
            reasons.append(f"{source_count} independent sources confirmed this indicator")
        if "c2" in threat_types or "command_and_control" in threat_types:
            reasons.append("Known Command & Control infrastructure")
        if "ddos" in threat_types:
            reasons.append("DDoS activity observed")
        if "scanner" in threat_types:
            reasons.append("Active internet scanner")
        if "botnet" in threat_types:
            reasons.append("Botnet activity observed")
        if malware_families:
            reasons.append(f"Associated malware: {', '.join(malware_families)}")

        first_seen_values = [r["first_seen"] for r in rows if r.get("first_seen")]
        last_seen_values = [r["last_seen"] for r in rows if r.get("last_seen")]

        self.db.table("assessments").upsert(
            {
                "indicator_id": indicator_id,
                "is_malicious": is_malicious,
                "confidence": confidence,
                "confidence_score": round(score, 4),
                "recommendation": recommendation,
                "source_count": source_count,
                "active_sources": active_source_slugs,
                "reasons": reasons,
                "threat_types": threat_types,
                "malware_families": malware_families,
                "first_seen": min(first_seen_values) if first_seen_values else None,
                "last_seen": max(last_seen_values) if last_seen_values else None,
                "computed_at": datetime.utcnow().isoformat(),
            },
            on_conflict="indicator_id",
        ).execute()

        # Also update aggregate fields on the indicator itself
        self.db.table("indicators").update(
            {
                "is_malicious": is_malicious,
                "confidence": confidence,
                "recommendation": recommendation,
                "source_count": source_count,
                "threat_types": threat_types,
                "malware_families": malware_families,
            }
        ).eq("id", indicator_id).execute()
