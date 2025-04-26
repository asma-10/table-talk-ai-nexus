
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Dict, Any
import pandas as pd
import io
import json
from uuid import uuid4
from datetime import datetime
import logging

from app.models.tables import Table, Column
from app.services.table_service import parse_csv, merge_tables, clean_table_data

# Set up logging
logger = logging.getLogger("tables")
logger.setLevel(logging.INFO)

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
    raise HTTPException(status_code=404, detail="Table not found")

@router.post("/upload", response_model=Table)
async def upload_table(file: UploadFile = File(...), name: str = Form(None)):
    try:
        content = await file.read()
        if not name:
            name = file.filename.split(".")[0] if file.filename else "Table"
        
        # Use the service to parse the CSV
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
        logger.info(f"Table uploaded: {name} with {len(result['data'])} rows")
        return table
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing upload: {str(e)}")

@router.post("/merge", response_model=Table)
async def merge_tables_endpoint(
    table_ids: List[str],
    name: str,
    join_type: str,
    column_mappings: Dict[str, str]
):
    if len(table_ids) < 2:
        raise HTTPException(status_code=400, detail="At least two tables are required for merging")
    
    tables_to_merge = []
    for id in table_ids:
        found = False
        for table in tables_db:
            if table.id == id:
                tables_to_merge.append(table)
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail=f"Table {id} not found")
    
    try:
        # Clean data before merging
        for table in tables_to_merge:
            table.data = clean_table_data(table.data)
        
        logger.info(f"Merging tables: {[t.name for t in tables_to_merge]} with join type {join_type}")
        merged_table = merge_tables(tables_to_merge, name, join_type, column_mappings)
        tables_db.append(merged_table)
        logger.info(f"Tables merged successfully: {merged_table.name} with {merged_table.rowCount} rows")
        return merged_table
    except Exception as e:
        logger.error(f"Error merging tables: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error merging tables: {str(e)}")

@router.delete("/{table_id}")
async def delete_table(table_id: str):
    global tables_db
    for i, table in enumerate(tables_db):
        if table.id == table_id:
            deleted_name = tables_db[i].name
            tables_db.pop(i)
            logger.info(f"Table deleted: {deleted_name}")
            return {"message": "Table deleted successfully"}
    raise HTTPException(status_code=404, detail="Table not found")

@router.post("/{table_id}/clean", response_model=Table)
async def clean_table(table_id: str):
    """Clean a table by removing rows with missing values"""
    for i, table in enumerate(tables_db):
        if table.id == table_id:
            try:
                # Use pandas to clean the data
                cleaned_data = clean_table_data(table.data)
                
                # Update the table with cleaned data
                tables_db[i].data = cleaned_data
                tables_db[i].rowCount = len(cleaned_data)
                
                logger.info(f"Table cleaned: {table.name}, rows after cleaning: {len(cleaned_data)}")
                return tables_db[i]
            except Exception as e:
                logger.error(f"Error cleaning table: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Error cleaning table: {str(e)}")
    
    raise HTTPException(status_code=404, detail="Table not found")
