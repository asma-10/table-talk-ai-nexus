
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from 'lucide-react';
import { useTables } from '@/context/TablesContext';

const ChatView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatSession, getTable } = useTables();
  
  const chatSession = id ? getChatSession(id) : undefined;
  const table = chatSession ? getTable(chatSession.tableId) : undefined;
  
  if (!chatSession || !table) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Chat session not found</h2>
            <p className="text-muted-foreground mb-4">The chat session you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/table/${table.id}`}>{table.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Chat</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex justify-between items-center mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/table/${table.id}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Table
            </Button>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatView;
