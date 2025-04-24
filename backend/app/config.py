
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TableTalk API"
    DEBUG_MODE: bool = True
    API_PREFIX: str = "/api"
    
    # Configuration pour l'intégration n8n
    N8N_WEBHOOK_URL: str = "https://asma-brb.app.n8n.cloud/webhook-test/process-tables"
    
    class Config:
        env_file = ".env"

settings = Settings()
