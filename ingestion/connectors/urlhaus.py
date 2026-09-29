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
from registry import register_connector

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
    supported_indicator_types = ["ipv4", "domain"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("URLhaus: downloading recent URL list")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "AUTH-KEY": "42c8353e152f6106aef35f9d87d7a27124035907feff3d84"
        }
        
        async with httpx.AsyncClient(timeout=120, follow_redirects=True, headers=headers) as client:
            resp = await client.get("https://urlhaus-api.abuse.ch/v1/urls/recent/")
            resp.raise_for_status()
            data = resp.json()

        rows = data.get("urls", [])
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
            if row.get("date_added"):
                try:
                    added_date = datetime.fromisoformat(row["date_added"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            host = row.get("host")
            if not host:
                # fallback parsing
                from urllib.parse import urlparse
                try:
                    host = urlparse(url).hostname
                except Exception:
                    host = None
                    
            if not host:
                continue

            # Determine if host is IP or Domain (simple check)
            import re
            is_ip = re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host)
            indicator_type = IndicatorType.IPV4 if is_ip else IndicatorType.DOMAIN

            yield NormalizedEvidence(
                indicator_value=host,
                indicator_type=indicator_type,
                source_classification=status,
                normalized_classification="malicious_host",
                threat_type="malware_delivery",
                malware_family=row.get("threat") or None,
                source_record_id=row.get("id", ""),
                source_url=row.get("urlhaus_link", ""),
                first_seen=added_date,
                last_seen=added_date,
                raw_data=dict(row),
                extra={
                    "url": url,
                    "url_status": status,
                    "tags": [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()],
                },
            )
