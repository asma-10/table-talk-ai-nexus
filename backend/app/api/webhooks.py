
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, List
from app.config import settings
import httpx
import json
import logging

# Set up logging
logger = logging.getLogger("webhooks")
logger.setLevel(logging.INFO)

router = APIRouter()

class MergeData(BaseModel):
    name: str
    tables: List[dict]
    joinType: str
    columnMappings: Dict[str, str]

class UserData(BaseModel):
    name: str
    email: str
    service: str
    mergeData: Optional[MergeData] = None

@router.post("/send-to-n8n")
async def send_to_n8n(data: UserData):
    if not settings.N8N_WEBHOOK_URL:
        logger.error("N8N webhook URL not configured")
        raise HTTPException(
            status_code=500,
            detail="N8N webhook URL not configured. Please set N8N_WEBHOOK_URL in environment variables."
        )
    
    try:
        logger.info(f"Sending data to N8N webhook: {settings.N8N_WEBHOOK_URL}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.N8N_WEBHOOK_URL,
                json=data.dict()
            )
            response.raise_for_status()
            logger.info("Successfully sent data to N8N")
            return {"status": "success", "n8n_response": response.json()}
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except httpx.RequestError as e:
        logger.error(f"Request error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
