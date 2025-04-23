
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTables } from '@/context/TablesContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, Table, Database, MessageCircle, Plus } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tables, chatSessions } = useTables();
  
  // Group tables by type
  const uploadedTables = tables.filter(table => table.type === 'uploaded');
  const mergedTables = tables.filter(table => table.type === 'merged');

  // Navigate to tables and scroll to upload section
  const handleUploadClick = () => {
    navigate('/tables');
    setTimeout(() => {
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <Table className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Table Talk</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* Quick Actions */}
        <div className="space-y-2">
          <Link to="/">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start", 
                location.pathname === "/" && "bg-muted"
              )}
            >
              <Table className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/tables">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start", 
                location.pathname === "/tables" && "bg-muted"
              )}
            >
              <Database className="mr-2 h-4 w-4" />
              Tables
            </Button>
          </Link>
        </div>
        
        {/* Recent Chats */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">RECENT CHATS</h3>
          </div>
          <div className="space-y-1">
            {chatSessions.length > 0 ? (
              chatSessions.map(session => (
                <Link to={`/chat/${session.id}`} key={session.id}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left overflow-hidden text-ellipsis", 
                      location.pathname === `/chat/${session.id}` && "bg-muted"
                    )}
                  >
                    <MessageCircle className="mr-2 h-3 w-3" />
                    <div className="truncate">{session.name}</div>
                  </Button>
                </Link>
              ))
            ) : (
              <div className="px-2 py-1 text-sm text-muted-foreground">No chats yet</div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Upload Button */}
      <div className="p-4 border-t border-border">
        <Button className="w-full" size="sm" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Table
        </Button>
      </div>
    </div>
  );
};
