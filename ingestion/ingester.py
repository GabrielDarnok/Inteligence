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

    async def ingest_batch(self, evidences: list[NormalizedEvidence], source_slug: str):
        """
        Persist a batch of evidence records efficiently.
        Returns outcome counts.
        """
        outcomes = {"new": 0, "updated": 0, "skipped": 0, "error": 0}
        
        if not evidences:
            return outcomes

        source_id = self._get_source_id(source_slug)
        if not source_id:
            logger.warning("Source not found", slug=source_slug)
            outcomes["error"] += len(evidences)
            return outcomes

        # 1. Upsert indicators
        indicator_payloads = []
        for ev in evidences:
            indicator_payloads.append({
                "value": ev.indicator_value,
                "type": ev.indicator_type.value,
                "first_seen": ev.first_seen.isoformat() if ev.first_seen else None,
                "last_seen": ev.last_seen.isoformat() if ev.last_seen else None,
            })
        
        # We need to upsert in chunks because Supabase limits large payloads
        # We'll map value -> id to use in evidence
        indicator_map = {}
        try:
            for i in range(0, len(indicator_payloads), 1000):
                chunk = indicator_payloads[i:i+1000]
                res = self.db.table("indicators").upsert(chunk, on_conflict="type,value").execute()
                for row in res.data:
                    indicator_map[row["value"]] = row["id"]
        except Exception as e:
            logger.error("Failed to batch upsert indicators", error=str(e))
            outcomes["error"] += len(evidences)
            return outcomes

        # 2. Upsert evidence
        evidence_payloads = []
        for ev in evidences:
            ind_id = indicator_map.get(ev.indicator_value)
            if not ind_id:
                continue
                
            evidence_payloads.append({
                "indicator_id": ind_id,
                "source_id": source_id,
                "source_classification": ev.source_classification,
                "normalized_classification": ev.normalized_classification,
                "threat_type": ev.threat_type,
                "malware_family": ev.malware_family,
                "source_record_id": ev.source_record_id or "",
                "source_url": ev.source_url,
                "first_seen": ev.first_seen.isoformat() if ev.first_seen else None,
                "last_seen": ev.last_seen.isoformat() if ev.last_seen else None,
                "expires_at": ev.expires_at.isoformat() if ev.expires_at else None,
                "raw_data": ev.raw_data or {},
                "extra": ev.extra or {},
                "collected_at": datetime.utcnow().isoformat(),
                "is_active": True,
            })

        try:
            for i in range(0, len(evidence_payloads), 1000):
                chunk = evidence_payloads[i:i+1000]
                self.db.table("evidence").upsert(chunk, on_conflict="indicator_id,source_id,source_record_id").execute()
                # We'll just mark them as updated for simplicity in batch processing
                outcomes["updated"] += len(chunk)
        except Exception as e:
            logger.error("Failed to batch upsert evidence", error=str(e))
        
        # 3. Upsert observations
        observation_payloads = []
        for ev in evidences:
            if not ev.last_seen:
                continue
            ind_id = indicator_map.get(ev.indicator_value)
            if not ind_id:
                continue
                
            observation_payloads.append({
                "indicator_id": ind_id,
                "source_id": source_id,
                "observed_at": ev.last_seen.isoformat(),
                "observation_type": ev.threat_type,
                "details": ev.extra or {},
            })
            
        try:
            for i in range(0, len(observation_payloads), 1000):
                chunk = observation_payloads[i:i+1000]
                self.db.table("observations").upsert(chunk, on_conflict="indicator_id,source_id,observed_at", ignore_duplicates=True).execute()
        except Exception as e:
            logger.error("Failed to batch upsert observations", error=str(e))

        # 4. Recompute assessments
        unique_indicator_ids = list(set(indicator_map.values()))
        try:
            self._recompute_assessments_batch(unique_indicator_ids)
        except Exception as e:
            logger.error("Failed to recompute assessments in batch", error=str(e))

        return outcomes

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
            self._recompute_assessments_batch([indicator_id])
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

    def _recompute_assessments_batch(self, indicator_ids: list[str]):
        if not indicator_ids:
            return

        # Fetch all evidence for these indicators
        evidences = []
        for i in range(0, len(indicator_ids), 200):
            chunk = indicator_ids[i:i+200]
            res = self.db.table("evidence").select("*").in_("indicator_id", chunk).eq("is_active", True).execute()
            if res.data:
                evidences.extend(res.data)

        # Group by indicator_id
        grouped = {}
        for ev in evidences:
            grouped.setdefault(ev["indicator_id"], []).append(ev)

        sources = self.db.table("sources").select("id,slug,name").execute().data or []
        source_map = {s["id"]: s for s in sources}

        # Fetch original indicators to preserve required fields for upsert
        indicators_res = []
        for i in range(0, len(indicator_ids), 200):
            chunk = indicator_ids[i:i+200]
            res = self.db.table("indicators").select("id,value,type,first_seen,last_seen").in_("id", chunk).execute()
            if res.data:
                indicators_res.extend(res.data)
        inds_map = {r["id"]: r for r in indicators_res}

        indicators_upserts = []
        assessments_upserts = []

        for ind_id in indicator_ids:
            rows = grouped.get(ind_id, [])
            if not rows or ind_id not in inds_map:
                continue

            threat_types = list({r["threat_type"] for r in rows if r.get("threat_type")})
            malware_families = list({r["malware_family"] for r in rows if r.get("malware_family")})
            active_source_slugs = list({source_map[r["source_id"]]["slug"] for r in rows if r["source_id"] in source_map})
            source_count = len(active_source_slugs)

            # Simple scoring
            is_malicious = source_count >= 1
            score = min(source_count / 5.0, 1.0)
            confidence = "low" if score < 0.4 else "medium" if score < 0.7 else "high"
            recommendation = "monitor" if score < 0.4 else "block"
            
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

            assessments_upserts.append({
                "indicator_id": ind_id,
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
            })

            payload = inds_map[ind_id].copy()
            payload.update({
                "is_malicious": is_malicious,
                "confidence": confidence,
                "recommendation": recommendation,
                "source_count": source_count,
                "threat_types": threat_types,
                "malware_families": malware_families,
            })
            indicators_upserts.append(payload)

        # Batch upsert indicators
        for i in range(0, len(indicators_upserts), 1000):
            self.db.table("indicators").upsert(
                indicators_upserts[i:i+1000], on_conflict="type,value"
            ).execute()

        # Batch upsert assessments
        for i in range(0, len(assessments_upserts), 1000):
            self.db.table("assessments").upsert(
                assessments_upserts[i:i+1000], on_conflict="indicator_id"
            ).execute()
