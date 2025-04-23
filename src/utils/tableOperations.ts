
import { Table, Column } from '../types/tables';
import { toast } from '@/components/ui/use-toast';

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
        // Update column type if not already set to number
        if (columns[index].type === 'string') {
          columns[index].type = 'string';
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
  
  if (joinType === 'inner') {
    const mappingKeys = Object.keys(columnMappings);
    
    mergedData = baseTable.data.reduce((acc, baseRow) => {
      const matches = secondTable.data.filter(secondRow => {
        return mappingKeys.every(baseCol => 
          baseRow[baseCol] === secondRow[columnMappings[baseCol]]
        );
      });
      
      matches.forEach(match => {
        const newRow = { ...baseRow };
        Object.keys(match).forEach(key => {
          if (!Object.values(columnMappings).includes(key)) {
            const newKey = baseRow.hasOwnProperty(key) ? `${secondTable.name}_${key}` : key;
            newRow[newKey] = match[key];
          }
        });
        acc.push(newRow);
      });
      
      return acc;
    }, [] as Record<string, any>[]);
  }
  
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
