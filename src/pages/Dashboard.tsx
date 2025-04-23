
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useTables } from '@/context/TablesContext';
import { Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { tables } = useTables();
  
  const recentTables = tables.slice(0, 4);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link to="/tables">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Manage Tables
            </Button>
          </Link>
        </div>

        {/* Recent Tables Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Tables</h2>
          {tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentTables.map((table) => (
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
                      <Link to={`/table/${table.id}`}>
                        View table
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-card">
              <p className="text-muted-foreground">No tables available.</p>
              <Link to="/tables" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  Upload your first table
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
