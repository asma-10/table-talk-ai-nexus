
import { Table, Column } from '../types/tables';
import { toast } from '@/hooks/use-toast';

export const parseCSV = (csvText: string): { columns: Column[], data: Record<string, any>[] } => {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(header => header.trim());
  
  const columns = headers.map(header => ({
    accessor: header,
    header,
    type: 'string' as const
  }));
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(val => val.trim());
    const row: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value);
        // Update column type if it's a number
        // Fix: Ensure we're using a type that's valid for Column.type
        if (columns[index].type === 'string') {
          columns[index].type = 'number' as const;
        }
      } else {
        row[header] = value;
      }
    });
    
    return row;
  });
  
  return { columns, data };
};

export const performTableMerge = (
  tablesToMerge: Table[],
  name: string,
  joinType: 'inner' | 'outer' | 'left' | 'right',
  columnMappings: Record<string, string>
): Table => {
  if (tablesToMerge.length < 2) {
    throw new Error("Need at least two tables to merge");
  }
  
  const baseTable = tablesToMerge[0];
  const secondTable = tablesToMerge[1];
  let mergedData: Record<string, any>[] = []; 
  
  // Fix for inner join
  if (joinType === 'inner') {
    const mappingKeys = Object.keys(columnMappings);
    
    baseTable.data.forEach(baseRow => {
      const matches = secondTable.data.filter(secondRow => {
        return mappingKeys.every(baseCol => {
          const baseValue = baseRow[baseCol];
          const secondValue = secondRow[columnMappings[baseCol]];
          // Compare values accounting for different types
          return String(baseValue) === String(secondValue);
        });
      });
      
      matches.forEach(match => {
        const newRow = { ...baseRow };
        Object.keys(match).forEach(key => {
          if (!mappingKeys.includes(columnMappings[key])) {
            const newKey = baseRow.hasOwnProperty(key) ? `${secondTable.name}_${key}` : key;
            newRow[newKey] = match[key];
          }
        });
        mergedData.push(newRow);
      });
    });
  }
  // Implement left join
  else if (joinType === 'left') {
    const mappingKeys = Object.keys(columnMappings);
    
    baseTable.data.forEach(baseRow => {
      const matches = secondTable.data.filter(secondRow => {
        return mappingKeys.every(baseCol => {
          return String(baseRow[baseCol]) === String(secondRow[columnMappings[baseCol]]);
        });
      });
      
      if (matches.length > 0) {
        // For matching rows
        matches.forEach(match => {
          const newRow = { ...baseRow };
          Object.keys(match).forEach(key => {
            if (!Object.values(columnMappings).includes(key)) {
              const newKey = baseRow.hasOwnProperty(key) ? `${secondTable.name}_${key}` : key;
              newRow[newKey] = match[key];
            }
          });
          mergedData.push(newRow);
        });
      } else {
        // For non-matching rows (include only base table data)
        const newRow = { ...baseRow };
        secondTable.columns.forEach(col => {
          if (!Object.values(columnMappings).includes(col.accessor)) {
            const newKey = baseRow.hasOwnProperty(col.accessor) ? `${secondTable.name}_${col.accessor}` : col.accessor;
            newRow[newKey] = null;
          }
        });
        mergedData.push(newRow);
      }
    });
  }
  // Implement right join
  else if (joinType === 'right') {
    const mappingKeys = Object.keys(columnMappings);
    
    secondTable.data.forEach(secondRow => {
      const matches = baseTable.data.filter(baseRow => {
        return mappingKeys.every(baseCol => {
          return String(baseRow[baseCol]) === String(secondRow[columnMappings[baseCol]]);
        });
      });
      
      if (matches.length > 0) {
        // For matching rows
        matches.forEach(match => {
          const newRow = { ...match };
          Object.keys(secondRow).forEach(key => {
            if (!mappingKeys.includes(columnMappings[key])) {
              const newKey = match.hasOwnProperty(key) ? `${secondTable.name}_${key}` : key;
              newRow[newKey] = secondRow[key];
            }
          });
          mergedData.push(newRow);
        });
      } else {
        // For non-matching rows (include only second table data)
        const newRow: Record<string, any> = {};
        baseTable.columns.forEach(col => {
          newRow[col.accessor] = null;
        });
        
        Object.keys(secondRow).forEach(key => {
          if (!Object.values(columnMappings).includes(key)) {
            const newKey = `${secondTable.name}_${key}`;
            newRow[newKey] = secondRow[key];
          } else {
            // For join columns, preserve the value
            const baseCol = Object.keys(columnMappings).find(k => columnMappings[k] === key);
            if (baseCol) {
              newRow[baseCol] = secondRow[key];
            }
          }
        });
        mergedData.push(newRow);
      }
    });
  }
  // Implement outer join
  else if (joinType === 'outer') {
    // First, do a left join
    const leftJoinData = [...performTableMerge(tablesToMerge, name, 'left', columnMappings).data];
    
    // Then add non-matched rows from second table (right join without duplicates)
    const mappingKeys = Object.keys(columnMappings);
    
    secondTable.data.forEach(secondRow => {
      const isMatched = baseTable.data.some(baseRow => {
        return mappingKeys.every(baseCol => {
          return String(baseRow[baseCol]) === String(secondRow[columnMappings[baseCol]]);
        });
      });
      
      if (!isMatched) {
        const newRow: Record<string, any> = {};
        baseTable.columns.forEach(col => {
          newRow[col.accessor] = null;
        });
        
        Object.keys(secondRow).forEach(key => {
          if (!Object.values(columnMappings).includes(key)) {
            const newKey = `${secondTable.name}_${key}`;
            newRow[newKey] = secondRow[key];
          } else {
            // For join columns, preserve the value
            const baseCol = Object.keys(columnMappings).find(k => columnMappings[k] === key);
            if (baseCol) {
              newRow[baseCol] = secondRow[key];
            }
          }
        });
        
        mergedData.push(newRow);
      }
    });
    
    mergedData = [...leftJoinData, ...mergedData];
  }
  
  // Build merged columns correctly
  let mergedColumns: Column[] = [...baseTable.columns];
  
  secondTable.columns.forEach(col => {
    const mappedValues = Object.values(columnMappings);
    
    if (!mappedValues.includes(col.accessor)) {
      const existingCol = mergedColumns.find(c => c.accessor === col.accessor);
      if (existingCol) {
        mergedColumns.push({
          ...col,
          accessor: `${secondTable.name}_${col.accessor}`,
          header: `${secondTable.name} ${col.header}`
        });
      } else {
        mergedColumns.push(col);
      }
    }
  });
  
  // Debug information
  console.log('Base table data count:', baseTable.data.length);
  console.log('Second table data count:', secondTable.data.length);
  console.log('Merged data count:', mergedData.length);
  console.log('Join type:', joinType);
  console.log('Column mappings:', columnMappings);
  
  return {
    id: `merged-${Date.now()}`,
    name,
    type: 'merged',
    createdAt: new Date(),
    columns: mergedColumns,
    data: mergedData,
    parentTables: tablesToMerge.map(t => t.id),
    rowCount: mergedData.length
  };
};
