
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useTables } from '@/context/TablesContext';
import { formatDistanceToNow } from 'date-fns';

export const ChatInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatSession, getTable, sendMessage } = useTables();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatSession = id ? getChatSession(id) : undefined;
  const table = chatSession ? getTable(chatSession.tableId) : undefined;
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages]);
  
  if (!chatSession || !table) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chat session not found</h2>
          <p className="text-muted-foreground mb-4">The chat session you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(chatSession.id, input.trim());
      setInput('');
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex-none pb-4">
        <h1 className="text-2xl font-bold">{chatSession.name}</h1>
        <p className="text-sm text-muted-foreground">
          Analyzing table: {table.name} • {table.rowCount} rows • {table.columns.length} columns
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {chatSession.messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card 
              className={`
                p-3 max-w-[80%] 
                ${message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
                }
              `}
            >
              <div className="mb-1">{message.content}</div>
              <div className="text-xs opacity-70">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </div>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex-none">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-xs text-muted-foreground mt-2">
          Try asking: "How many rows are in this table?", "What columns are available?", 
          or "What is the average of [column]?"
        </div>
      </div>
    </div>
  );
};
