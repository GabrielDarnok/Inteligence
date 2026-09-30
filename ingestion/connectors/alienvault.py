"""
AlienVault OTX connector
API: https://otx.alienvault.com/api/v1/
Requires: ALIENVAULT_API_KEY
Indicator types: IPv4, Domain, URL
"""
import os
import httpx
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from registry import register_connector

logger = structlog.get_logger()

OTX_URL = "https://otx.alienvault.com/api/v1/pulses/activity"


@register_connector
class AlienVaultOTXConnector(BaseConnector):
    slug = "alienvault"
    name = "AlienVault OTX"
    description = "Crowdsourced Threat Intelligence Pulses"
    website = "https://otx.alienvault.com"
    license = "Commercial (free tier)"
    terms_of_use = "https://otx.alienvault.com/terms"
    auth_required = True
    update_frequency = "real-time"
    supported_indicator_types = ["ipv4", "domain", "url"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        api_key = os.environ.get("ALIENVAULT_API_KEY", "")
        if not api_key:
            logger.warning("AlienVault OTX: no API key configured, skipping")
            return

        logger.info("AlienVault OTX: downloading recent activity pulses")

        headers = {
            "X-OTX-API-KEY": api_key,
            "Accept": "application/json"
        }
        
        params = {
            "limit": 20,
            "modified_since": (datetime.utcnow() - __import__("datetime").timedelta(days=7)).isoformat()
        }

        try:
            async with httpx.AsyncClient(timeout=120, follow_redirects=True, headers=headers) as client:
                resp = await client.get(OTX_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as e:
            logger.warning("AlienVault OTX: API error", error=str(e))
            return

        pulses = data.get("results", [])
        logger.info("AlienVault OTX: pulses received", count=len(pulses))

        for pulse in pulses:
            pulse_name = pulse.get("name", "Unknown Pulse")
            pulse_id = pulse.get("id", "")
            tags = pulse.get("tags", [])
            indicators = pulse.get("indicators", [])
            
            for ind in indicators:
                ind_type = ind.get("type", "")
                ind_val = ind.get("indicator", "").strip()
                
                if not ind_val:
                    continue

                mapped_type = None
                if ind_type in ("IPv4", "IPv4-Scan", "IPv4-Botnet"):
                    mapped_type = IndicatorType.IPV4
                elif ind_type == "domain":
                    mapped_type = IndicatorType.DOMAIN
                elif ind_type == "URL":
                    mapped_type = IndicatorType.URL
                    
                if not mapped_type:
                    continue

                created_str = ind.get("created") or pulse.get("created")
                created_dt = None
                if created_str:
                    try:
                        # OTX dates end in +00:00 or Z
                        created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
                    except ValueError:
                        pass

                yield NormalizedEvidence(
                    indicator_value=ind_val,
                    indicator_type=mapped_type,
                    source_classification=ind_type,
                    normalized_classification="malicious_indicator",
                    threat_type="general",
                    malware_family=None,
                    source_record_id=str(ind.get("id", "")),
                    source_url=f"https://otx.alienvault.com/pulse/{pulse_id}",
                    first_seen=created_dt,
                    last_seen=created_dt,
                    raw_data=ind,
                    extra={
                        "pulse_name": pulse_name,
                        "tags": tags,
                        "description": ind.get("description", "")
                    },
                )
