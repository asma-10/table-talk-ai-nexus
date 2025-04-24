from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tables, chats, webhooks

app = FastAPI(
    title="TableTalk API",
    description="API for TableTalk - AI Data Nexus",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez l'URL exacte
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers API
app.include_router(tables.router, prefix="/api/tables", tags=["tables"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API TableTalk", 
        "docs": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
