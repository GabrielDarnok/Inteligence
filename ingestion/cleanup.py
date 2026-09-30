#!/usr/bin/env python3
"""
Cleanup script to remove stale indicators.
Any indicator not seen across ANY feed in the last 14 days will be deleted.
Due to ON DELETE CASCADE in the database, this will also wipe out 
their associated evidence, observations, and assessments.
"""
import sys
import os
import structlog
from datetime import datetime, timedelta

# Make sure we can import from the ingestion folder
sys.path.insert(0, os.path.dirname(__file__))

from db import get_supabase

logger = structlog.get_logger()

def run_cleanup():
    logger.info("Starting cleanup of stale indicators")
    db = get_supabase()
    
    threshold = (datetime.utcnow() - timedelta(days=14)).isoformat()
    
    try:
        # Delete indicators last seen more than 14 days ago
        res = db.table("indicators").delete().lt("last_seen", threshold).execute()
        
        deleted_count = len(res.data) if res.data else 0
        logger.info("Cleanup finished successfully", deleted_indicators=deleted_count, threshold=threshold)
    except Exception as e:
        logger.error("Error during cleanup", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    run_cleanup()
