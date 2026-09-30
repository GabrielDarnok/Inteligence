"""
Blocklist.de connector
API: https://www.blocklist.de/en/export.html
Requires: No API Key
Indicator types: IPv4
"""
import httpx
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from registry import register_connector

logger = structlog.get_logger()

BLOCKLIST_URL = "https://lists.blocklist.de/lists/all.txt"


@register_connector
class BlocklistDeConnector(BaseConnector):
    slug = "blocklist_de"
    name = "Blocklist.de"
    description = "Fail2Ban reporting network"
    website = "https://www.blocklist.de"
    license = "Public"
    terms_of_use = "https://www.blocklist.de/en/terms.html"
    auth_required = False
    update_frequency = "hourly"
    supported_indicator_types = ["ipv4"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("Blocklist.de: downloading all.txt")

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with httpx.AsyncClient(timeout=120, follow_redirects=True, headers=headers) as client:
            resp = await client.get(BLOCKLIST_URL)
            resp.raise_for_status()
            content = resp.text

        lines = [l.strip() for l in content.splitlines() if l.strip() and not l.startswith("#")]
        logger.info("Blocklist.de: records received", count=len(lines))

        now = datetime.now(timezone.utc)

        for ip in lines:
            yield NormalizedEvidence(
                indicator_value=ip,
                indicator_type=IndicatorType.IPV4,
                source_classification="attacker",
                normalized_classification="malicious_ip",
                threat_type="brute_force",
                malware_family=None,
                source_record_id=ip,
                source_url=f"https://www.blocklist.de/en/search.html?ip={ip}",
                first_seen=now,
                last_seen=now,
                raw_data={"ip": ip},
            )
