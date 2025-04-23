
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTables } from '@/context/TablesContext';
import { Table } from '@/types/tables';
import { CheckCircle } from 'lucide-react';

interface MergeTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MergeTablesDialog: React.FC<MergeTablesDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { tables, mergeTables } = useTables();
  const availableTables = tables.filter(t => t.data.length > 0);
  
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableName, setTableName] = useState('');
  const [joinType, setJoinType] = useState<'inner' | 'outer' | 'left' | 'right'>('inner');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  
  // Reset state when the dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTables([]);
      setTableName('');
      setJoinType('inner');
      setColumnMappings({});
    }
  }, [open]);
  
  // Update table name when tables are selected
  useEffect(() => {
    if (selectedTables.length >= 2) {
      const table1 = tables.find(t => t.id === selectedTables[0]);
      const table2 = tables.find(t => t.id === selectedTables[1]);
      if (table1 && table2) {
        setTableName(`${table1.name} + ${table2.name}`);
      }
    }
  }, [selectedTables, tables]);
  
  // Get column options for the first selected table
  const getFirstTableColumns = () => {
    if (selectedTables.length === 0) return [];
    const table = tables.find(t => t.id === selectedTables[0]);
    return table ? table.columns : [];
  };
  
  // Get column options for the second selected table
  const getSecondTableColumns = () => {
    if (selectedTables.length < 2) return [];
    const table = tables.find(t => t.id === selectedTables[1]);
    return table ? table.columns : [];
  };
  
  // Handle column mapping selection
  const handleColumnMappingChange = (baseColumn: string, mappedColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [baseColumn]: mappedColumn
    }));
  };
  
  // Check if we can merge (need 2 tables and at least one column mapping)
  const canMerge = selectedTables.length >= 2 && 
                   tableName.trim() !== '' && 
                   Object.keys(columnMappings).length > 0;
  
  const handleMerge = async () => {
    if (!canMerge) return;
    
    try {
      await mergeTables(
        selectedTables,
        tableName.trim(),
        joinType,
        columnMappings
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Error merging tables:', error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Tables</DialogTitle>
          <DialogDescription>
            Select tables to merge and configure how they should be joined.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Table Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseTable">Base Table</Label>
              <Select
                value={selectedTables[0] || ""}
                onValueChange={(value) => 
                  setSelectedTables(prev => [value, prev[1] || ""])
                }
              >
                <SelectTrigger id="baseTable">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondTable">Second Table</Label>
              <Select
                value={selectedTables[1] || ""}
                onValueChange={(value) => 
                  setSelectedTables(prev => [prev[0] || "", value])
                }
                disabled={!selectedTables[0]}
              >
                <SelectTrigger id="secondTable">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables
                    .filter(table => table.id !== selectedTables[0])
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Merged Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter a name for the merged table"
            />
          </div>
          
          {/* Join Type */}
          <div className="space-y-2">
            <Label htmlFor="joinType">Join Type</Label>
            <Select
              value={joinType}
              onValueChange={(value: 'inner' | 'outer' | 'left' | 'right') => setJoinType(value)}
            >
              <SelectTrigger id="joinType">
                <SelectValue placeholder="Select join type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inner">Inner Join</SelectItem>
                <SelectItem value="outer" disabled>Outer Join (Coming Soon)</SelectItem>
                <SelectItem value="left" disabled>Left Join (Coming Soon)</SelectItem>
                <SelectItem value="right" disabled>Right Join (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Inner Join: Only include rows where the joined columns match in both tables
            </p>
          </div>
          
          {/* Column Mappings */}
          {selectedTables.length >= 2 && (
            <div className="space-y-4">
              <Label>Column Mappings</Label>
              <p className="text-xs text-muted-foreground">
                Select which columns to match between tables
              </p>
              
              {getFirstTableColumns().map(column => (
                <div key={column.accessor} className="grid grid-cols-2 gap-4 items-center">
                  <div className="text-sm font-medium overflow-hidden text-ellipsis">
                    {column.header}
                  </div>
                  <Select
                    value={columnMappings[column.accessor] || ""}
                    onValueChange={(value) => 
                      handleColumnMappingChange(column.accessor, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Match with..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getSecondTableColumns().map(secondColumn => (
                        <SelectItem key={secondColumn.accessor} value={secondColumn.accessor}>
                          {secondColumn.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={!canMerge}
            className="flex items-center"
          >
            {canMerge && <CheckCircle className="mr-2 h-4 w-4" />}
            Merge Tables
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
