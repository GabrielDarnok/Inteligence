"""
CISA KEV (Known Exploited Vulnerabilities) connector
Source: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
License: Public Domain
Note: KEV entries are CVEs/vulnerabilities, not traditional network indicators.
We store them as URL-type indicators pointing to the vulnerability reference.
"""
import httpx
import structlog
from datetime import datetime, timezone
from typing import AsyncIterator

from base_connector import BaseConnector
from models import NormalizedEvidence, IndicatorType
from run import register_connector

logger = structlog.get_logger()

KEV_JSON = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"


@register_connector
class CISAKEVConnector(BaseConnector):
    slug = "cisa_kev"
    name = "CISA KEV"
    description = "CISA Known Exploited Vulnerabilities catalog"
    website = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
    license = "Public Domain"
    terms_of_use = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
    auth_required = False
    update_frequency = "daily"
    supported_indicator_types = ["url"]

    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        logger.info("CISA KEV: downloading catalog")

        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(KEV_JSON)
            resp.raise_for_status()
            data = resp.json()

        vulns = data.get("vulnerabilities", [])
        logger.info("CISA KEV: records received", count=len(vulns))

        for vuln in vulns:
            cve_id = vuln.get("cveID", "").strip()
            if not cve_id:
                continue

            due_date = None
            if vuln.get("dueDate"):
                try:
                    due_date = datetime.fromisoformat(vuln["dueDate"]).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            date_added = None
            if vuln.get("dateAdded"):
                try:
                    date_added = datetime.fromisoformat(vuln["dateAdded"]).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            # Use the NVD URL as the indicator value
            indicator_value = f"https://nvd.nist.gov/vuln/detail/{cve_id}"

            yield NormalizedEvidence(
                indicator_value=indicator_value,
                indicator_type=IndicatorType.URL,
                source_classification="known_exploited_vulnerability",
                normalized_classification="exploited_vulnerability",
                threat_type="exploitation",
                malware_family=None,
                source_record_id=cve_id,
                source_url=f"https://www.cisa.gov/known-exploited-vulnerabilities-catalog#{cve_id}",
                first_seen=date_added,
                last_seen=date_added,
                expires_at=due_date,
                raw_data=vuln,
                extra={
                    "cve_id": cve_id,
                    "vendor_project": vuln.get("vendorProject"),
                    "product": vuln.get("product"),
                    "vulnerability_name": vuln.get("vulnerabilityName"),
                    "short_description": vuln.get("shortDescription"),
                    "required_action": vuln.get("requiredAction"),
                    "due_date": vuln.get("dueDate"),
                    "notes": vuln.get("notes"),
                },
            )
