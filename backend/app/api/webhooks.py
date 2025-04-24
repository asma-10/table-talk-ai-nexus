
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
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

async def send_to_webhook(url: str, data: dict) -> dict:
    """Send data to a webhook in the background."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Sending data to webhook: {url}")
            response = await client.post(url, json=data)
            response.raise_for_status()
            logger.info(f"Successfully sent data to webhook: {url}")
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending to webhook: {str(e)}")
        raise

@router.post("/send-to-n8n")
async def send_to_n8n(data: UserData, background_tasks: BackgroundTasks):
    """Send data to n8n webhook."""
    if not settings.N8N_WEBHOOK_URL:
        logger.error("N8N webhook URL not configured")
        raise HTTPException(
            status_code=500,
            detail="N8N webhook URL not configured. Please set N8N_WEBHOOK_URL in environment variables."
        )
    
    try:
        # Process data to ensure it's serializable
        payload = data.dict()

        # Validate the n8n webhook URL
        webhook_url = settings.N8N_WEBHOOK_URL
        logger.info(f"Preparing to send data to N8N webhook: {webhook_url}")
        
        # Use background task for sending to avoid timeout
        background_tasks.add_task(send_to_webhook, webhook_url, payload)
        
        return {"status": "success", "message": "Data is being sent to n8n webhook"}
    except Exception as e:
        logger.error(f"Error processing webhook request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing webhook request: {str(e)}")
