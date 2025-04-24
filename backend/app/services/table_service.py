
from typing import List, Dict, Any
from app.models.tables import Table, Column
from uuid import uuid4
from datetime import datetime

def parse_csv(csv_text: str) -> Dict[str, Any]:
    """
    Parse CSV text into columns and data
    """
    lines = [line for line in csv_text.split('\n') if line.strip()]
    headers = [header.strip() for header in lines[0].split(',')]
    
    columns = []
    for header in headers:
        columns.append(Column(
            accessor=header,
            header=header,
            type="string"
        ))
    
    data = []
    for line in lines[1:]:
        values = [val.strip() for val in line.split(',')]
        row = {}
        
        for i, header in enumerate(headers):
            value = values[i] if i < len(values) else ""
            
            # Detect data type
            if value and value.replace('.', '', 1).isdigit():
                row[header] = float(value)
                # Update column type if consistently numeric
                if columns[i].type == "string":
                    columns[i].type = "number"
            else:
                row[header] = value
                
        data.append(row)
    
    return {
        "columns": columns,
        "data": data
    }

def merge_tables(tables_to_merge: List[Table], name: str, join_type: str, column_mappings: Dict[str, str]) -> Table:
    """
    Merge tables based on column mappings and join type
    """
    if len(tables_to_merge) < 2:
        raise ValueError("Need at least two tables to merge")
    
    base_table = tables_to_merge[0]
    second_table = tables_to_merge[1]
    merged_data = []
    
    if join_type == "inner":
        mapping_keys = list(column_mappings.keys())
        
        for base_row in base_table.data:
            for second_row in second_table.data:
                match = True
                
                for base_col in mapping_keys:
                    if base_row.get(base_col) != second_row.get(column_mappings[base_col]):
                        match = False
                        break
                
                if match:
                    new_row = {**base_row}
                    
                    for key, value in second_row.items():
                        if key not in column_mappings.values():
                            new_key = f"{second_table.name}_{key}" if key in base_row else key
                            new_row[new_key] = value
                    
                    merged_data.append(new_row)
    
    # Créer les colonnes fusionnées
    merged_columns = list(base_table.columns)
    mapped_values = list(column_mappings.values())
    
    for col in second_table.columns:
        if col.accessor not in mapped_values:
            if any(c.accessor == col.accessor for c in merged_columns):
                new_col = Column(
                    accessor=f"{second_table.name}_{col.accessor}",
                    header=f"{second_table.name} {col.header}",
                    type=col.type
                )
                merged_columns.append(new_col)
            else:
                merged_columns.append(col)
    
    return Table(
        id=f"merged-{uuid4()}",
        name=name,
        type="merged",
        createdAt=datetime.now(),
        columns=merged_columns,
        data=merged_data,
        parentTables=[t.id for t in tables_to_merge],
        rowCount=len(merged_data)
    )
