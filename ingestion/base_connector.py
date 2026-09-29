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
            async for evidence in self.fetch():
                outcome = await ingester.ingest(evidence, self.slug)
                result.records_fetched += 1
                if outcome == "new":
                    result.records_new += 1
                elif outcome == "updated":
                    result.records_updated += 1
                elif outcome == "skipped":
                    result.records_skipped += 1
                else:
                    result.records_error += 1

            result.status = "success"
        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
        finally:
            result.finished_at = datetime.utcnow()

        return result
