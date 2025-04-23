
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, MessageCircle, Download, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTables } from '@/context/TablesContext';
import { Table as TableType } from '@/types/tables';

interface TableListProps {
  tables: TableType[];
  title: string;
  description?: string;
}

export const TableList: React.FC<TableListProps> = ({ 
  tables, 
  title, 
  description 
}) => {
  const navigate = useNavigate();
  const { deleteTable, createChatSession } = useTables();

  const handleChatClick = (tableId: string) => {
    const sessionId = createChatSession(tableId);
    navigate(`/chat/${sessionId}`);
  };

  const handleTableClick = (tableId: string) => {
    navigate(`/table/${tableId}`);
  };

  const handleDownload = (table: TableType) => {
    // Convert table data to CSV
    const headers = table.columns.map(col => col.header).join(',');
    const rows = table.data.map(row => 
      table.columns.map(col => row[col.accessor]).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (tables.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        <Card className="border-dashed border-2">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No tables available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold truncate">
                {table.name}
              </CardTitle>
              <CardDescription className="flex items-center text-xs">
                {table.type === 'merged' ? 'Merged • ' : 'Uploaded • '}
                {formatDistanceToNow(new Date(table.createdAt), { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-sm">
                <span className="font-medium">{table.rowCount}</span> rows •{' '}
                <span className="font-medium">{table.columns.length}</span> columns
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleTableClick(table.id)}>
                <Table className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleChatClick(table.id)}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(table)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
