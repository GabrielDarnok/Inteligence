"""
Base connector interface.
Every connector must implement this class.
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator
from models import NormalizedEvidence, ConnectorResult
from datetime import datetime


class BaseConnector(ABC):
    # Must be defined in every connector
    slug: str = ""
    name: str = ""
    description: str = ""
    website: str = ""
    license: str = ""
    terms_of_use: str = ""
    auth_required: bool = False
    update_frequency: str = "daily"
    supported_indicator_types: list[str] = []

    @abstractmethod
    async def fetch(self) -> AsyncIterator[NormalizedEvidence]:
        """
        Fetch and yield normalized evidence records from this source.
        Must be an async generator.
        """
        ...

    async def run(self) -> ConnectorResult:
        """
        Execute the full ingestion cycle for this connector.
        Override only if you need custom behavior beyond fetch().
        """
        from ingester import Ingester
        result = ConnectorResult(source_slug=self.slug, started_at=datetime.utcnow())
        ingester = Ingester()

        try:
            batch = []
            async for evidence in self.fetch():
                batch.append(evidence)
                if len(batch) >= 1000:
                    outcomes = await ingester.ingest_batch(batch, self.slug)
                    result.records_fetched += len(batch)
                    result.records_new += outcomes["new"]
                    result.records_updated += outcomes["updated"]
                    result.records_skipped += outcomes["skipped"]
                    result.records_error += outcomes["error"]
                    batch = []

            if batch:
                outcomes = await ingester.ingest_batch(batch, self.slug)
                result.records_fetched += len(batch)
                result.records_new += outcomes["new"]
                result.records_updated += outcomes["updated"]
                result.records_skipped += outcomes["skipped"]
                result.records_error += outcomes["error"]

            result.status = "success"
        except Exception as e:
            import structlog
            structlog.get_logger().exception("Connector failed", error=str(e))
            result.status = "error"
            result.error_message = str(e)
        finally:
            result.finished_at = datetime.utcnow()

        return result
