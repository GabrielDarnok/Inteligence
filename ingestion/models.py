from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class IndicatorType(str, Enum):
    IPV4 = "ipv4"
    IPV6 = "ipv6"
    CIDR = "cidr"
    DOMAIN = "domain"
    URL = "url"
    MD5 = "md5"
    SHA1 = "sha1"
    SHA256 = "sha256"
    ASN = "asn"
    CERTIFICATE = "certificate"


class NormalizedEvidence(BaseModel):
    """
    A normalized piece of evidence from a source.
    This is what every connector must produce.
    """
    # Indicator fields
    indicator_value: str
    indicator_type: IndicatorType

    # Evidence classification
    source_classification: Optional[str] = None     # original value from source
    normalized_classification: Optional[str] = None  # our normalized label
    threat_type: Optional[str] = None               # "c2", "ddos", "scanner", etc.
    malware_family: Optional[str] = None

    # Provenance
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None

    # Temporal
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    # Full original record (for transparency)
    raw_data: Optional[dict[str, Any]] = None

    # Any extra normalized fields
    extra: dict[str, Any] = {}


class ConnectorResult(BaseModel):
    source_slug: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str = "running"             # "success", "error", "partial"
    records_fetched: int = 0
    records_new: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    records_error: int = 0
    error_message: Optional[str] = None
    log_lines: list[str] = []
