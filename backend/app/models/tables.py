
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class Column(BaseModel):
    accessor: str
    header: str
    type: Literal["string", "number", "boolean", "date"]

class Table(BaseModel):
    id: str
    name: str
    type: Literal["uploaded", "merged"]
    createdAt: datetime
    lastAccessed: Optional[datetime] = None
    columns: List[Column]
    data: List[Dict[str, Any]]
    parentTables: Optional[List[str]] = None
    rowCount: int
