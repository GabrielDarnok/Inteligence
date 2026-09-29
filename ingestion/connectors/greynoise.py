"""
GreyNoise connector
API: https://docs.greynoise.io/
Requires: GREYNOISE_API_KEY (free tier available at greynoise.io)
Indicator types: IPv4
"""
import httpx
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from config import settings
from run import register_connector

logger = structlog.get_logger()

GNQL_URL = "https://api.greynoise.io/v2/experimental/gnql"


@register_connector
class GreyNoiseConnector(BaseConnector):
    slug = "greynoise"
    name = "GreyNoise"
    description = "Internet scanner and noise intelligence"
    website = "https://greynoise.io"
    license = "Commercial (free tier)"
    terms_of_use = "https://greynoise.io/terms"
    auth_required = True
    update_frequency = "real-time"
    supported_indicator_types = ["ipv4"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        if not settings.greynoise_api_key:
            logger.warning("GreyNoise: no API key configured, skipping")
            return

        headers = {
            "key": settings.greynoise_api_key,
            "Accept": "application/json",
        }

        # Query for malicious IPs seen in last 1 day
        params = {
            "query": "classification:malicious last_seen:1d",
            "size": 10000,
            "scroll": "true",
        }

        scroll_token = None
        page = 0

        async with httpx.AsyncClient(timeout=60) as client:
            while True:
                if scroll_token:
                    params["scroll"] = scroll_token

                resp = await client.get(GNQL_URL, headers=headers, params=params)
                if resp.status_code == 429:
                    logger.warning("GreyNoise: rate limited, stopping")
                    break
                resp.raise_for_status()
                data = resp.json()

                results = data.get("data", [])
                page += 1
                logger.info("GreyNoise: page received", page=page, count=len(results))

                for ip_data in results:
                    ip = ip_data.get("ip", "").strip()
                    if not ip:
                        continue

                    last_seen = None
                    if ip_data.get("last_seen"):
                        try:
                            last_seen = datetime.fromisoformat(ip_data["last_seen"]).replace(tzinfo=timezone.utc)
                        except ValueError:
                            pass

                    first_seen = None
                    if ip_data.get("first_seen"):
                        try:
                            first_seen = datetime.fromisoformat(ip_data["first_seen"]).replace(tzinfo=timezone.utc)
                        except ValueError:
                            pass

                    classification = ip_data.get("classification", "")
                    tags = ip_data.get("tags") or []
                    threat_type = "scanner"
                    if classification == "malicious":
                        threat_type = "malicious"

                    yield NormalizedEvidence(
                        indicator_value=ip,
                        indicator_type=IndicatorType.IPV4,
                        source_classification=classification,
                        normalized_classification=classification,
                        threat_type=threat_type,
                        malware_family=None,
                        source_record_id=ip,
                        source_url=f"https://viz.greynoise.io/ip/{ip}",
                        first_seen=first_seen,
                        last_seen=last_seen,
                        raw_data=ip_data,
                        extra={
                            "noise": ip_data.get("noise"),
                            "riot": ip_data.get("riot"),
                            "tags": tags,
                            "asn": ip_data.get("metadata", {}).get("asn"),
                            "country": ip_data.get("metadata", {}).get("country"),
                            "organization": ip_data.get("metadata", {}).get("organization"),
                        },
                    )

                scroll_token = data.get("scroll")
                if not scroll_token or not results:
                    break
