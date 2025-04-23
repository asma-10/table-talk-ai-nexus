
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TableList } from '@/components/tables/TableList';
import { TableUpload } from '@/components/upload/TableUpload';
import { MergeTablesDialog } from '@/components/merge/MergeTablesDialog';
import { Button } from '@/components/ui/button';
import { useTables } from '@/context/TablesContext';
import { Merge, Plus } from 'lucide-react';

const Dashboard = () => {
  const { tables } = useTables();
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  
  const uploadedTables = tables.filter(table => table.type === 'uploaded');
  const mergedTables = tables.filter(table => table.type === 'merged');
  
  const canMergeTables = uploadedTables.length >= 2;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setMergeDialogOpen(true)}
              disabled={!canMergeTables}
            >
              <Merge className="mr-2 h-4 w-4" />
              Merge Tables
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Upload New Table</h2>
            <TableUpload />
          </div>
          
          {/* Recent Tables Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Recent Tables</h2>
            {tables.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tables.slice(0, 4).map((table) => (
                  <div 
                    key={table.id} 
                    className="p-4 border rounded-md bg-card flex flex-col"
                  >
                    <div className="font-medium mb-1 truncate">{table.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {table.type === 'merged' ? 'Merged • ' : 'Uploaded • '}
                      {table.rowCount} rows • {table.columns.length} columns
                    </div>
                    <div className="mt-auto">
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-sm" 
                        asChild
                      >
                        <a href={`/table/${table.id}`}>
                          View table
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md bg-card">
                <p className="text-muted-foreground">No tables available. Upload one to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Tables */}
        <TableList 
          title="Uploaded Tables" 
          description="Tables directly uploaded to the platform" 
          tables={uploadedTables} 
        />
        
        {/* Merged Tables */}
        <TableList 
          title="Merged Tables" 
          description="Tables created by merging existing tables" 
          tables={mergedTables} 
        />
        
        {/* Merge Tables Dialog */}
        <MergeTablesDialog 
          open={mergeDialogOpen} 
          onOpenChange={setMergeDialogOpen} 
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
