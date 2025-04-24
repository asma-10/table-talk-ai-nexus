
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings
import httpx
import json

router = APIRouter()

class UserData(BaseModel):
    name: str
    email: str
    service: str

@router.post("/send-to-n8n")
async def send_to_n8n(data: UserData):
    if not settings.N8N_WEBHOOK_URL:
        raise HTTPException(
            status_code=500,
            detail="N8N webhook URL not configured. Please set N8N_WEBHOOK_URL in environment variables."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.N8N_WEBHOOK_URL,
                json=data.dict()
            )
            return {"status": "success", "n8n_response": response.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

