"""
ThreatFox connector (abuse.ch)
API: https://threatfox-api.abuse.ch/api/v1/
License: CC0 — no authentication required
Indicator types: IPv4, IPv6, Domain, URL, MD5, SHA1, SHA256
"""
import httpx
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from registry import register_connector

logger = structlog.get_logger()

API_URL = "https://threatfox-api.abuse.ch/api/v1/"

TYPE_MAP = {
    "ip:port": IndicatorType.IPV4,
    "domain": IndicatorType.DOMAIN,
}

THREAT_TYPE_MAP = {
    "botnet_cc": "c2",
    "payload": "malware_delivery",
    "payload_delivery": "malware_delivery",
    "phishing": "phishing",
    "spam": "spam",
}


@register_connector
class ThreatFoxConnector(BaseConnector):
    slug = "threatfox"
    name = "ThreatFox"
    description = "IOC database by abuse.ch — C2, malware, botnets"
    website = "https://threatfox.abuse.ch"
    license = "CC0"
    terms_of_use = "https://threatfox.abuse.ch/api/"
    auth_required = False
    update_frequency = "daily"
    supported_indicator_types = ["ipv4", "ipv6", "domain"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("ThreatFox: fetching recent IOCs")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "AUTH-KEY": "42c8353e152f6106aef35f9d87d7a27124035907feff3d84"
        }
        payload = {"query": "get_iocs", "days": 1}
        
        async with httpx.AsyncClient(timeout=60, follow_redirects=True, headers=headers) as client:
            resp = await client.post("https://threatfox-api.abuse.ch/api/v1/", json=payload)
            resp.raise_for_status()
            data = resp.json()
            logger.info("ThreatFox: API Response Keys", keys=list(data.keys()), status=data.get("query_status"))

        iocs = data.get("data", [])

        # Removemos o limite de 100 para puxar todos os milhares de indicadores
        logger.info("ThreatFox: records received", count=len(iocs))

        for ioc in iocs:
            ioc_type = ioc.get("ioc_type", "")
            indicator_type = TYPE_MAP.get(ioc_type)
            if not indicator_type:
                continue

            value = ioc.get("ioc", "").strip()
            # Strip port from ip:port indicators
            if ioc_type == "ip:port" and ":" in value:
                value = value.split(":")[0]
            if not value:
                continue

            threat_type_raw = ioc.get("threat_type", "")
            threat_type = THREAT_TYPE_MAP.get(threat_type_raw, threat_type_raw)

            first_seen = None
            if ioc.get("first_seen"):
                try:
                    first_seen = datetime.fromisoformat(ioc["first_seen"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            last_seen = None
            if ioc.get("last_seen"):
                try:
                    last_seen = datetime.fromisoformat(ioc["last_seen"].replace(" ", "T")).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            yield NormalizedEvidence(
                indicator_value=value,
                indicator_type=indicator_type,
                source_classification=threat_type_raw,
                normalized_classification=threat_type,
                threat_type=threat_type,
                malware_family=ioc.get("malware"),
                source_record_id=str(ioc.get("id", "")),
                source_url=f"https://threatfox.abuse.ch/ioc/{ioc.get('id', '')}",
                first_seen=first_seen,
                last_seen=last_seen,
                raw_data=ioc,
                extra={
                    "confidence_level": ioc.get("confidence_level"),
                    "tags": ioc.get("tags") or [],
                    "reporter": ioc.get("reporter"),
                    "reference": ioc.get("reference"),
                },
            )
