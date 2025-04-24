
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime
import json

from app.models.chats import ChatSession, Message
from app.api.tables import tables_db  # Référence aux tables stockées en mémoire
from app.services.chat_service import process_ai_response

router = APIRouter()

# Stockage en mémoire pour les sessions de chat (à remplacer par une base de données en production)
chat_sessions = []

@router.get("/", response_model=List[ChatSession])
async def get_all_chat_sessions():
    return chat_sessions

@router.get("/{session_id}", response_model=ChatSession)
async def get_chat_session(session_id: str):
    for session in chat_sessions:
        if session.id == session_id:
            return session
    raise HTTPException(status_code=404, detail="Session de chat non trouvée")

@router.post("/create", response_model=ChatSession)
async def create_chat_session(table_id: str, name: str = None):
    # Vérifier que la table existe
    table = None
    for t in tables_db:
        if t.id == table_id:
            table = t
            break
    
    if not table:
        raise HTTPException(status_code=404, detail="Table non trouvée")
    
    session_id = f"chat-{uuid4()}"
    session_name = name or f"Chat about {table.name}"
    
    new_session = ChatSession(
        id=session_id,
        tableId=table_id,
        name=session_name,
        createdAt=datetime.now(),
        messages=[
            Message(
                id=f"msg-{uuid4()}",
                role="system",
                content=f"This is an AI assistant to help you analyze the table: {table.name}. Ask any questions about the data.",
                timestamp=datetime.now()
            )
        ]
    )
    
    chat_sessions.append(new_session)
    return new_session

@router.post("/{session_id}/message", response_model=Message)
async def send_message(session_id: str, message_content: str):
    # Trouver la session de chat
    session = None
    for s in chat_sessions:
        if s.id == session_id:
            session = s
            break
    
    if not session:
        raise HTTPException(status_code=404, detail="Session de chat non trouvée")
    
    # Trouver la table associée
    table = None
    for t in tables_db:
        if t.id == session.tableId:
            table = t
            break
    
    if not table:
        raise HTTPException(status_code=404, detail="Table associée non trouvée")
    
    # Ajouter le message utilisateur
    user_message = Message(
        id=f"msg-{uuid4()}",
        role="user",
        content=message_content,
        timestamp=datetime.now()
    )
    
    for i, s in enumerate(chat_sessions):
        if s.id == session_id:
            chat_sessions[i].messages.append(user_message)
            break
    
    # Générer la réponse AI
    ai_response = process_ai_response(message_content, table)
    
    # Ajouter la réponse AI
    ai_message = Message(
        id=f"msg-{uuid4()}",
        role="system",
        content=ai_response,
        timestamp=datetime.now()
    )
    
    for i, s in enumerate(chat_sessions):
        if s.id == session_id:
            chat_sessions[i].messages.append(ai_message)
            break
    
    return ai_message

@router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    global chat_sessions
    for i, session in enumerate(chat_sessions):
        if session.id == session_id:
            chat_sessions.pop(i)
            return {"message": "Session de chat supprimée avec succès"}
    raise HTTPException(status_code=404, detail="Session de chat non trouvée")
