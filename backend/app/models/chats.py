
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    id: str
    role: str  # 'user' ou 'system'
    content: str
    timestamp: datetime

class ChatSession(BaseModel):
    id: str
    tableId: str
    name: str
    createdAt: datetime
    messages: List[Message]
