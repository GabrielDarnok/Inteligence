"""
URLhaus connector (abuse.ch)
API: https://urlhaus-api.abuse.ch/
License: CC0 — no authentication required
Indicator types: URL, Domain, IPv4
"""
import httpx
import csv
import io
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from run import register_connector

logger = structlog.get_logger()

# Recent URLs (last 30 days), CSV format
CSV_URL = "https://urlhaus.abuse.ch/downloads/csv_recent/"


@register_connector
class URLhausConnector(BaseConnector):
    slug = "urlhaus"
    name = "URLhaus"
    description = "Malicious URL database by abuse.ch"
    website = "https://urlhaus.abuse.ch"
    license = "CC0"
    terms_of_use = "https://urlhaus.abuse.ch/api/"
    auth_required = False
    update_frequency = "daily"
    supported_indicator_types = ["url", "domain", "ipv4"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("URLhaus: downloading recent URL list")

        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(CSV_URL)
            resp.raise_for_status()
            content = resp.text

        # Skip comment lines starting with #
        lines = [l for l in content.splitlines() if not l.startswith("#")]
        reader = csv.DictReader(lines)
        rows = list(reader)
        logger.info("URLhaus: records received", count=len(rows))

        for row in rows:
            url = row.get("url", "").strip()
            if not url:
                continue

            status = row.get("url_status", "")
            # Only yield active/online or unknown status
            if status == "offline":
                continue

            added_date = None
            if row.get("dateadded"):
                try:
                    added_date = datetime.fromisoformat(row["dateadded"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            yield NormalizedEvidence(
                indicator_value=url,
                indicator_type=IndicatorType.URL,
                source_classification=status,
                normalized_classification="malicious_url",
                threat_type="malware_delivery",
                malware_family=row.get("threat") or None,
                source_record_id=row.get("id", ""),
                source_url=row.get("urlhaus_link", ""),
                first_seen=added_date,
                last_seen=added_date,
                raw_data=dict(row),
                extra={
                    "url_status": status,
                    "host": row.get("host", ""),
                    "tags": [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()],
                },
            )
