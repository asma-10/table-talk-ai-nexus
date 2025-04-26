
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TableTalk API"
    DEBUG_MODE: bool = True
    API_PREFIX: str = "/api"
    
    class Config:
        env_file = ".env"

settings = Settings()
