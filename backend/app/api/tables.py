
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Dict, Any
import pandas as pd
import io
import json
from uuid import uuid4
from datetime import datetime

from app.models.tables import Table, Column
from app.services.table_service import parse_csv, merge_tables

router = APIRouter()

# Pour stocker les tables en mémoire (en production, utilisez une base de données)
tables_db = []

@router.get("/", response_model=List[Table])
async def get_all_tables():
    return tables_db

@router.get("/{table_id}", response_model=Table)
async def get_table(table_id: str):
    for table in tables_db:
        if table.id == table_id:
            return table
    raise HTTPException(status_code=404, detail="Table non trouvée")

@router.post("/upload", response_model=Table)
async def upload_table(file: UploadFile = File(...), name: str = Form(None)):
    try:
        content = await file.read()
        if not name:
            name = file.filename.split(".")[0] if file.filename else "Table"
        
        # Utiliser le service pour parser le CSV
        result = parse_csv(content.decode('utf-8'))
        
        table = Table(
            id=f"table-{uuid4()}",
            name=name,
            type="uploaded",
            createdAt=datetime.now(),
            columns=result["columns"],
            data=result["data"],
            rowCount=len(result["data"])
        )
        
        tables_db.append(table)
        return table
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement: {str(e)}")

@router.post("/merge", response_model=Table)
async def merge_tables_endpoint(
    table_ids: List[str],
    name: str,
    join_type: str,
    column_mappings: Dict[str, str]
):
    if len(table_ids) < 2:
        raise HTTPException(status_code=400, detail="Au moins deux tables sont nécessaires pour fusionner")
    
    tables_to_merge = []
    for id in table_ids:
        found = False
        for table in tables_db:
            if table.id == id:
                tables_to_merge.append(table)
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail=f"Table {id} non trouvée")
    
    try:
        merged_table = merge_tables(tables_to_merge, name, join_type, column_mappings)
        tables_db.append(merged_table)
        return merged_table
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la fusion: {str(e)}")

@router.delete("/{table_id}")
async def delete_table(table_id: str):
    global tables_db
    for i, table in enumerate(tables_db):
        if table.id == table_id:
            tables_db.pop(i)
            return {"message": "Table supprimée avec succès"}
    raise HTTPException(status_code=404, detail="Table non trouvée")
