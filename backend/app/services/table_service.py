
from typing import List, Dict, Any, Optional
from app.models.tables import Table, Column
from uuid import uuid4
from datetime import datetime
import pandas as pd
import numpy as np
import logging

# Set up logging
logger = logging.getLogger("table_service")
logger.setLevel(logging.INFO)

def parse_csv(csv_text: str) -> Dict[str, Any]:
    """
    Parse CSV text into columns and data with data cleaning
    """
    try:
        # Parse CSV with pandas
        df = pd.read_csv(pd.StringIO(csv_text))
        
        # Convert to list of dicts for our API
        columns = []
        for column in df.columns:
            col_type = "string"
            
            # Detect column type
            if pd.api.types.is_numeric_dtype(df[column]):
                col_type = "number"
            elif pd.api.types.is_datetime64_dtype(df[column]):
                col_type = "date"
            elif df[column].dtype == bool:
                col_type = "boolean"
            
            columns.append(Column(
                accessor=column,
                header=column,
                type=col_type
            ))
        
        # Clean the data - fill NaN with appropriate values
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(0)
            else:
                df[column] = df[column].fillna("")
        
        data = df.to_dict('records')
        
        return {
            "columns": columns,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error parsing CSV: {str(e)}")
        raise ValueError(f"Error parsing CSV: {str(e)}")

def clean_table_data(table_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Clean table data by removing rows with missing values and standardizing formats
    """
    if not table_data:
        return []
    
    try:
        # Convert to pandas DataFrame
        df = pd.DataFrame(table_data)
        
        # Drop rows where all values are missing
        df = df.dropna(how='all')
        
        # Fill missing numeric values with 0 and strings with empty string
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(0)
            else:
                df[col] = df[col].fillna("")
        
        # Convert back to list of dicts
        return df.to_dict('records')
    except Exception as e:
        logger.error(f"Error cleaning table data: {str(e)}")
        return table_data  # Return original data if cleaning fails

def merge_tables(tables_to_merge: List[Table], name: str, join_type: str, column_mappings: Dict[str, str]) -> Table:
    """
    Merge tables based on column mappings and join type with pandas
    """
    if len(tables_to_merge) < 2:
        raise ValueError("Need at least two tables to merge")
    
    try:
        base_table = tables_to_merge[0]
        second_table = tables_to_merge[1]
        
        # Convert to pandas DataFrames
        df1 = pd.DataFrame(base_table.data)
        df2 = pd.DataFrame(second_table.data)
        
        # Clean data before merging
        if not df1.empty:
            df1 = df1.dropna(how='all')
        if not df2.empty:
            df2 = df2.dropna(how='all')
        
        logger.info(f"Merging tables with join type: {join_type}")
        logger.info(f"Table 1 rows: {len(df1)}")
        logger.info(f"Table 2 rows: {len(df2)}")
        logger.info(f"Column mappings: {column_mappings}")
        
        # Create mapping for pandas merge
        left_on = list(column_mappings.keys())
        right_on = list(column_mappings.values())
        
        # Handle edge cases
        if not left_on or not right_on:
            raise ValueError("No column mappings provided for join")
            
        # Ensure all columns exist in respective DataFrames
        for col in left_on:
            if col not in df1.columns:
                raise ValueError(f"Column '{col}' not found in first table")
        
        for col in right_on:
            if col not in df2.columns:
                raise ValueError(f"Column '{col}' not found in second table")
        
        # Perform the merge based on join type
        if join_type == "inner":
            merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='inner', suffixes=('', f'_{second_table.name}'))
        elif join_type == "outer":
            merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='outer', suffixes=('', f'_{second_table.name}'))
        elif join_type == "left":
            merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='left', suffixes=('', f'_{second_table.name}'))
        elif join_type == "right":
            merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='right', suffixes=('', f'_{second_table.name}'))
        else:
            # Default to inner join
            merged_df = pd.merge(df1, df2, left_on=left_on, right_on=right_on, how='inner', suffixes=('', f'_{second_table.name}'))
        
        # Clean merged DataFrame - fill NaN values appropriately
        for col in merged_df.columns:
            if pd.api.types.is_numeric_dtype(merged_df[col]):
                merged_df[col] = merged_df[col].fillna(0)
            else:
                merged_df[col] = merged_df[col].fillna("")
                
        logger.info(f"Merged table rows: {len(merged_df)}")
        
        # Convert merged DataFrame to list of dicts
        merged_data = merged_df.to_dict('records')
        
        # Create merged columns with proper typing
        merged_columns = []
        for col in merged_df.columns:
            col_type = "string"
            if pd.api.types.is_numeric_dtype(merged_df[col]):
                col_type = "number"
            elif pd.api.types.is_datetime64_dtype(merged_df[col]):
                col_type = "date"
            elif merged_df[col].dtype == bool:
                col_type = "boolean"
                
            merged_columns.append(Column(
                accessor=col,
                header=col.replace(f'_{second_table.name}', f' ({second_table.name})') if f'_{second_table.name}' in col else col,
                type=col_type
            ))
        
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
    except Exception as e:
        logger.error(f"Error merging tables: {str(e)}")
        raise ValueError(f"Error merging tables: {str(e)}")
