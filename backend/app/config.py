
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TableTalk API"
    DEBUG_MODE: bool = True
    API_PREFIX: str = "/api"
    
    # Configuration pour l'intégration n8n future
    N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
