import os
from supabase import create_client

def main():
    url = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    if not key:
        print("Need SUPABASE_SERVICE_KEY")
        return
        
    client = create_client(url, key)
    
    # Delete inactive sources
    to_delete = ["cisa_kev", "greynoise", "shadowserver", "spamhaus"]
    
    print("Deleting unused sources...")
    for slug in to_delete:
        try:
            res = client.table("sources").delete().eq("slug", slug).execute()
            print(f"Deleted {slug}: {len(res.data)} records")
        except Exception as e:
            print(f"Failed to delete {slug}: {e}")
            
    # Also add the new ones if they don't exist
    new_sources = [
        {
            "slug": "blocklist_de",
            "name": "Blocklist.de",
            "description": "Fail2Ban reporting service for SSH, Mail, and web attacks",
            "website": "https://www.blocklist.de",
            "license": "Free",
            "auth_required": False,
            "update_frequency": "daily",
            "supported_indicator_types": ["ipv4", "ipv6"]
        },
        {
            "slug": "abuseipdb",
            "name": "AbuseIPDB",
            "description": "Crowdsourced IP abuse reporting",
            "website": "https://www.abuseipdb.com",
            "license": "Commercial (free tier)",
            "auth_required": True,
            "update_frequency": "real-time",
            "supported_indicator_types": ["ipv4", "ipv6"]
        },
        {
            "slug": "alienvault",
            "name": "AlienVault OTX",
            "description": "Open Threat Exchange by AT&T Cybersecurity",
            "website": "https://otx.alienvault.com",
            "license": "Free",
            "auth_required": True,
            "update_frequency": "real-time",
            "supported_indicator_types": ["ipv4", "ipv6", "domain", "url", "md5", "sha256"]
        }
    ]
    
    print("Adding new sources...")
    for source in new_sources:
        try:
            # check if exists
            exists = client.table("sources").select("slug").eq("slug", source["slug"]).execute()
            if not exists.data:
                client.table("sources").insert(source).execute()
                print(f"Added {source['slug']}")
            else:
                print(f"Source {source['slug']} already exists")
        except Exception as e:
            print(f"Failed to add {source['slug']}: {e}")
            
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    main()
