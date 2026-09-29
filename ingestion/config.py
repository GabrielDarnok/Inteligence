from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str

    greynoise_api_key: Optional[str] = None
    shadowserver_api_key: Optional[str] = None
    shadowserver_api_secret: Optional[str] = None

    log_level: str = "INFO"
    log_file: str = "./logs/ingestion.log"

    enabled_connectors: str = "threatfox,urlhaus,feodo,cisa_kev"
    schedule_cron: str = "0 */6 * * *"

    @property
    def enabled_connector_list(self) -> list[str]:
        if self.enabled_connectors.lower() == "all":
            return ["threatfox", "urlhaus", "feodo", "cisa_kev", "greynoise", "shadowserver", "spamhaus"]
        return [c.strip() for c in self.enabled_connectors.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
