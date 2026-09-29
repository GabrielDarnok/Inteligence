#!/usr/bin/env python3
"""
Entry point for running a specific connector.
Usage: python run.py --connector threatfox
       python run.py --connector all
"""
import asyncio
import argparse
import sys
import os
import structlog
from datetime import datetime

# Make sure we can import from the ingestion folder
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from db import get_supabase
from ingester import Ingester
from registry import CONNECTOR_REGISTRY

def load_connectors():
    """Import all connector modules to trigger registration."""
    from connectors import threatfox, urlhaus, feodo, cisa_kev
    try:
        from connectors import greynoise
    except Exception:
        pass
    try:
        from connectors import shadowserver
    except Exception:
        pass
    try:
        from connectors import spamhaus
    except Exception:
        pass


async def run_connector(slug: str):
    load_connectors()

    if slug not in CONNECTOR_REGISTRY:
        logger.error("Unknown connector", slug=slug)
        sys.exit(1)

    connector_cls = CONNECTOR_REGISTRY[slug]
    connector = connector_cls()

    logger = structlog.get_logger()
    logger.info("Starting connector", connector=slug, time=datetime.utcnow().isoformat())

    result = await connector.run()

    logger.info(
        "Connector finished",
        connector=slug,
        status=result.status,
        fetched=result.records_fetched,
        new=result.records_new,
        updated=result.records_updated,
        skipped=result.records_skipped,
        errors=result.records_error,
    )

    # Persist run log to Supabase
    db = get_supabase()
    source_row = db.table("sources").select("id").eq("slug", slug).single().execute()
    if source_row.data:
        source_id = source_row.data["id"]
        db.table("ingestion_runs").insert({
            "source_id": source_id,
            "started_at": result.started_at.isoformat(),
            "finished_at": result.finished_at.isoformat() if result.finished_at else None,
            "status": result.status,
            "records_fetched": result.records_fetched,
            "records_new": result.records_new,
            "records_updated": result.records_updated,
            "records_skipped": result.records_skipped,
            "records_error": result.records_error,
            "error_message": result.error_message,
        }).execute()

        db.table("sources").update({
            "last_sync_at": result.finished_at.isoformat() if result.finished_at else None,
            "last_sync_status": result.status,
            "last_sync_message": result.error_message,
            "last_sync_records_fetched": result.records_fetched,
            "last_sync_records_new": result.records_new,
            "last_sync_records_updated": result.records_updated,
        }).eq("slug", slug).execute()

    if result.status == "error":
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OTI Ingestion Runner")
    parser.add_argument(
        "--connector",
        required=True,
        help="Connector slug to run (e.g. threatfox, urlhaus, all)",
    )
    args = parser.parse_args()

    asyncio.run(run_connector(args.connector))
