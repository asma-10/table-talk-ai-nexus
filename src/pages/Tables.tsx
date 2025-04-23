
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TableList } from '@/components/tables/TableList';
import { TableUpload } from '@/components/upload/TableUpload';
import { MergeTablesDialog } from '@/components/merge/MergeTablesDialog';
import { Button } from '@/components/ui/button';
import { useTables } from '@/context/TablesContext';
import { Merge, Plus } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Tables = () => {
  const { tables } = useTables();
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  
  const uploadedTables = tables.filter(table => table.type === 'uploaded');
  const mergedTables = tables.filter(table => table.type === 'merged');
  
  const canMergeTables = uploadedTables.length >= 2;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Tables</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Tables</h1>
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
          <div className="lg:col-span-1" id="upload-section">
            <h2 className="text-xl font-semibold mb-4">Upload New Table</h2>
            <TableUpload />
          </div>
          
          {/* Tables Overview */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Tables Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 border rounded-lg">
                <div className="text-2xl font-bold">{uploadedTables.length}</div>
                <div className="text-sm text-muted-foreground">Uploaded Tables</div>
              </div>
              <div className="p-6 border rounded-lg">
                <div className="text-2xl font-bold">{mergedTables.length}</div>
                <div className="text-sm text-muted-foreground">Merged Tables</div>
              </div>
            </div>
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

export default Tables;
