"""
Feodo Tracker connector (abuse.ch)
API: https://feodotracker.abuse.ch/
License: CC0 — no authentication required
Indicator types: IPv4, Domain (C2 botnet infrastructure)
"""
import httpx
import json
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from run import register_connector

logger = structlog.get_logger()

BLOCKLIST_JSON = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"


@register_connector
class FeodoConnector(BaseConnector):
    slug = "feodo"
    name = "Feodo Tracker"
    description = "C2 and botnet infrastructure tracker by abuse.ch"
    website = "https://feodotracker.abuse.ch"
    license = "CC0"
    terms_of_use = "https://feodotracker.abuse.ch/blocklist/"
    auth_required = False
    update_frequency = "daily"
    supported_indicator_types = ["ipv4", "domain"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("Feodo Tracker: downloading blocklist")

        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(BLOCKLIST_JSON)
            resp.raise_for_status()
            records = resp.json()

        logger.info("Feodo Tracker: records received", count=len(records))

        for rec in records:
            ip = rec.get("ip_address", "").strip()
            if not ip:
                continue

            first_seen = None
            if rec.get("first_seen"):
                try:
                    first_seen = datetime.fromisoformat(rec["first_seen"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            last_online = None
            if rec.get("last_online"):
                try:
                    last_online = datetime.fromisoformat(rec["last_online"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            yield NormalizedEvidence(
                indicator_value=ip,
                indicator_type=IndicatorType.IPV4,
                source_classification=rec.get("malware", ""),
                normalized_classification="command_and_control",
                threat_type="c2",
                malware_family=rec.get("malware"),
                source_record_id=ip,  # IP is the unique key in Feodo
                source_url="https://feodotracker.abuse.ch/browse/",
                first_seen=first_seen,
                last_seen=last_online,
                raw_data=rec,
                extra={
                    "port": rec.get("port"),
                    "status": rec.get("status"),
                    "country": rec.get("country"),
                    "hostname": rec.get("hostname"),
                    "as_number": rec.get("as_number"),
                    "as_name": rec.get("as_name"),
                },
            )
