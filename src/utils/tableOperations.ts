export const mergeTablesByColumns = (tables: any[], mergeConfig: any): any => {
  if (!tables || tables.length === 0 || !mergeConfig || !mergeConfig.columnMerges) {
    return { success: false, message: "Invalid input: tables or mergeConfig is missing." };
  }

  try {
    const columnMerges = mergeConfig.columnMerges;
    const firstTable = tables[0];

    if (!firstTable || !firstTable.columns || !firstTable.data) {
      return { success: false, message: "The first table is missing columns or data." };
    }

    const mergedColumns = [...firstTable.columns];
    const mergedColumnIds = new Set(mergedColumns.map((col: any) => col.id));
    
    for (const table of tables.slice(1)) {
      if (!table || !table.columns) {
        return { success: false, message: "A table is missing columns." };
      }
      
      for (const column of table.columns) {
        if (!mergedColumnIds.has(column.id)) {
          mergedColumns.push(column);
          mergedColumnIds.add(column.id);
        }
      }
    }
    
    const mergedData: Record<string, any>[] = [];

    for (const table of tables) {
      if (!table || !table.data) {
        return { success: false, message: "A table is missing data." };
      }
      
      for (const row of table.data) {
        const mergedRow: Record<string, any> = {};
        for (const column of mergedColumns) {
          const sourceColumn = table.columns.find((col: any) => col.id === column.id);
          if (sourceColumn) {
            mergedRow[column.id] = row[sourceColumn.name];
          } else {
            mergedRow[column.id] = null;
          }
        }
        mergedData.push(mergedRow);
      }
    }

    return { 
      success: true, 
      data: mergedData, 
      columns: mergedColumns, 
      name: 'Merged Table',
      type: 'merged',
      rowCount: mergedData.length,
    };

  } catch (error: any) {
    console.error("Error merging tables:", error);
    return { success: false, message: `Error merging tables: ${error.message}` };
  }
};
