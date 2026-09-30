"""
AbuseIPDB connector
API: https://docs.abuseipdb.com/#blacklist-endpoint
Requires: ABUSEIPDB_API_KEY
Indicator types: IPv4
"""
import httpx
import structlog
import os
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from registry import register_connector

logger = structlog.get_logger()

ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/blacklist"


@register_connector
class AbuseIPDBConnector(BaseConnector):
    slug = "abuseipdb"
    name = "AbuseIPDB"
    description = "Crowdsourced IP abuse reports"
    website = "https://www.abuseipdb.com"
    license = "Commercial (free tier)"
    terms_of_use = "https://www.abuseipdb.com/terms"
    auth_required = True
    update_frequency = "daily"
    supported_indicator_types = ["ipv4"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        api_key = os.environ.get("ABUSEIPDB_API_KEY", "")
        if not api_key:
            logger.warning("AbuseIPDB: no API key configured, skipping")
            return

        logger.info("AbuseIPDB: downloading IP blacklist")

        headers = {
            "Accept": "application/json",
            "Key": api_key
        }
        
        # Free tier is limited to 10,000 records
        params = {
            "confidenceMinimum": 90,
            "limit": 10000
        }

        async with httpx.AsyncClient(timeout=120, follow_redirects=True, headers=headers) as client:
            resp = await client.get(ABUSEIPDB_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("data", [])
        logger.info("AbuseIPDB: records received", count=len(records))

        for row in records:
            ip = row.get("ipAddress", "").strip()
            if not ip:
                continue

            last_reported = None
            if row.get("lastReportedAt"):
                try:
                    last_reported = datetime.fromisoformat(row["lastReportedAt"].replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            yield NormalizedEvidence(
                indicator_value=ip,
                indicator_type=IndicatorType.IPV4,
                source_classification="malicious_ip",
                normalized_classification="malicious_ip",
                threat_type="scanner",
                malware_family=None,
                source_record_id=ip,
                source_url=f"https://www.abuseipdb.com/check/{ip}",
                first_seen=last_reported,
                last_seen=last_reported,
                raw_data=dict(row),
                extra={
                    "abuse_confidence_score": row.get("abuseConfidenceScore")
                },
            )
