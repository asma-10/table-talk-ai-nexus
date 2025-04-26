
from typing import List, Dict, Any
from app.models.tables import Table, Column
from uuid import uuid4
from datetime import datetime
import pandas as pd

def parse_csv(csv_text: str) -> Dict[str, Any]:
    """
    Parse CSV text into columns and data with data cleaning
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
            
            # Detect data type and handle missing values
            if value == "" or value.lower() in ["na", "n/a", "null", "none"]:
                # Handle missing values - set to empty string for strings, null for numbers
                if columns[i].type == "number":
                    row[header] = None
                else:
                    row[header] = ""
            elif value and value.replace('.', '', 1).isdigit():
                row[header] = float(value)
                # Update column type if consistently numeric
                if columns[i].type == "string":
                    columns[i].type = "number"
            else:
                row[header] = value
                
        data.append(row)
    
    # Convert to pandas for cleaning, then back to dict
    df = pd.DataFrame(data)
    
    # Basic cleaning - remove rows where all values are missing
    df = df.dropna(how='all')
    
    # Convert back to list of dicts
    cleaned_data = df.to_dict('records')
    
    return {
        "columns": columns,
        "data": cleaned_data
    }

def clean_table_data(table_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Clean table data by removing rows with missing values and standardizing formats
    """
    if not table_data:
        return []
    
    df = pd.DataFrame(table_data)
    
    # Drop rows where all values are missing
    df = df.dropna(how='all')
    
    # Fill missing numeric values with 0 and strings with empty string
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64']:
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("")
    
    # Convert back to list of dicts
    return df.to_dict('records')

def merge_tables(tables_to_merge: List[Table], name: str, join_type: str, column_mappings: Dict[str, str]) -> Table:
    """
    Merge tables based on column mappings and join type with pandas
    """
    if len(tables_to_merge) < 2:
        raise ValueError("Need at least two tables to merge")
    
    base_table = tables_to_merge[0]
    second_table = tables_to_merge[1]
    
    # Convert to pandas DataFrames for easier merging
    df1 = pd.DataFrame(base_table.data)
    df2 = pd.DataFrame(second_table.data)
    
    # Clean data before merging
    if not df1.empty:
        df1 = df1.dropna(how='all')
    if not df2.empty:
        df2 = df2.dropna(how='all')
    
    # Create mapping for pandas merge
    left_on = list(column_mappings.keys())
    right_on = list(column_mappings.values())
    
    # Perform the merge based on join type
    if join_type == "inner":
        merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='inner')
    elif join_type == "outer":
        merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='outer')
    elif join_type == "left":
        merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='left')
    elif join_type == "right":
        merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='right')
    else:
        # Default to inner join
        merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='inner')
    
    # Avoid duplicate column names by renaming columns from the second table
    # that have the same name as columns in the first table
    rename_cols = {}
    for col in df2.columns:
        if col in df1.columns and col not in right_on:  # Don't rename join columns
            rename_cols[col] = f"{second_table.name}_{col}"
    
    if rename_cols:
        for old_col, new_col in rename_cols.items():
            if old_col in merged_df.columns:
                merged_df = merged_df.rename(columns={old_col: new_col})
    
    # Convert merged DataFrame back to list of dicts
    merged_data = merged_df.to_dict('records')
    
    # Create merged columns
    merged_columns = list(base_table.columns)
    mapped_values = list(column_mappings.values())
    
    for col in second_table.columns:
        if col.accessor not in mapped_values:
            new_accessor = col.accessor
            if any(c.accessor == col.accessor for c in merged_columns):
                new_accessor = f"{second_table.name}_{col.accessor}"
            
            new_col = Column(
                accessor=new_accessor,
                header=f"{second_table.name} {col.header}" if new_accessor != col.accessor else col.header,
                type=col.type
            )
            merged_columns.append(new_col)
    
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
