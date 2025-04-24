
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
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendDataToN8n } from '@/utils/webhookOperations';

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
  const [isLoading, setIsLoading] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  
  useEffect(() => {
    if (open) {
      setSelectedTables([]);
      setTableName('');
      setJoinType('inner');
      setColumnMappings({});
      setIsLoading(false);
      setWebhookSent(false);
    }
  }, [open]);
  
  useEffect(() => {
    if (selectedTables.length >= 2) {
      const table1 = tables.find(t => t.id === selectedTables[0]);
      const table2 = tables.find(t => t.id === selectedTables[1]);
      if (table1 && table2) {
        setTableName(`${table1.name} + ${table2.name}`);
      }
    }
  }, [selectedTables, tables]);
  
  const getFirstTableColumns = () => {
    if (selectedTables.length === 0) return [];
    const table = tables.find(t => t.id === selectedTables[0]);
    return table ? table.columns : [];
  };
  
  const getSecondTableColumns = () => {
    if (selectedTables.length < 2) return [];
    const table = tables.find(t => t.id === selectedTables[1]);
    return table ? table.columns : [];
  };
  
  const handleColumnMappingChange = (baseColumn: string, mappedColumn: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [baseColumn]: mappedColumn
    }));
  };
  
  const canMerge = selectedTables.length >= 2 && 
                   tableName.trim() !== '' && 
                   Object.keys(columnMappings).length > 0;
  
  const handleMerge = async () => {
    if (!canMerge) return;
    
    try {
      setIsLoading(true);
      const tablesToMerge = selectedTables
        .map(id => tables.find(t => t.id === id))
        .filter(Boolean) as Table[];
      
      // Prepare for webhook
      const mergeData = {
        name: tableName.trim(),
        tables: tablesToMerge.map(table => ({
          id: table.id,
          name: table.name,
          columns: table.columns,
          // Send only necessary data to reduce payload size
          data: table.data.slice(0, 100), // Limit to first 100 rows
        })),
        joinType,
        columnMappings
      };
      
      // First try to send to N8n
      try {
        await sendDataToN8n({
          name: tableName.trim(),
          email: "user@example.com",
          service: "table_merge",
          mergeData
        });
        
        toast({
          title: "Webhook success",
          description: "Data was successfully sent to n8n workflow",
        });
        
        setWebhookSent(true);
      } catch (webhookError) {
        console.error('N8n webhook error:', webhookError);
        toast({
          title: "Webhook error",
          description: "Could not send data to n8n workflow. Continuing with local merge.",
          variant: "destructive"
        });
      }
      
      // Then perform the merge locally
      await mergeTables(
        selectedTables,
        tableName.trim(),
        joinType,
        columnMappings
      );
      
      toast({
        title: "Success",
        description: "Tables merged successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error during merge operation:', error);
      toast({
        title: "Error",
        description: "An error occurred while merging tables",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
          
          <div className="space-y-2">
            <Label htmlFor="tableName">Merged Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter a name for the merged table"
            />
          </div>
          
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
            disabled={!canMerge || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoading && canMerge && <CheckCircle className="h-4 w-4" />}
            Merge Tables
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
