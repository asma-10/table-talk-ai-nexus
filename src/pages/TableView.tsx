
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { useTables } from '@/context/TablesContext';
import { MessageCircle, Download, ArrowLeft, Trash } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from 'date-fns';

const TableView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTable, deleteTable, createChatSession } = useTables();
  
  const table = id ? getTable(id) : undefined;
  
  const handleDelete = () => {
    if (table) {
      deleteTable(table.id);
      navigate('/');
    }
  };
  
  const handleChat = () => {
    if (table) {
      const sessionId = createChatSession(table.id);
      navigate(`/chat/${sessionId}`);
    }
  };
  
  const handleDownload = () => {
    if (!table) return;
    
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
  
  if (!table) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Table not found</h2>
            <p className="text-muted-foreground mb-4">The table you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // For merged tables, get parent table names
  const getParentTableInfo = () => {
    if (table.type !== 'merged' || !table.parentTables) return null;
    
    return (
      <div className="text-sm text-muted-foreground mt-1">
        Created from: {table.parentTables.map(id => {
          const parentTable = getTable(id);
          return parentTable ? parentTable.name : 'Unknown table';
        }).join(', ')}
      </div>
    );
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Table View</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Table Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{table.name}</h1>
            <div className="text-sm text-muted-foreground">
              {table.type === 'merged' ? 'Merged table' : 'Uploaded table'} • 
              Created on {format(new Date(table.createdAt), 'PP')} • 
              {table.rowCount} rows • 
              {table.columns.length} columns
            </div>
            {getParentTableInfo()}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleChat}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Table Content */}
        {table.data.length > 0 ? (
          <DataTable columns={table.columns} data={table.data} />
        ) : (
          <div className="text-center py-12 border rounded-md">
            <p className="text-muted-foreground">This table is empty.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TableView;
