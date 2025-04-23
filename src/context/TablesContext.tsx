
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Table, ChatSession, Column } from '../types/tables';
import { parseCSV, performTableMerge } from '../utils/tableOperations';
import { createNewChatSession, processAIResponse } from '../utils/chatOperations';

interface TablesContextType {
  tables: Table[];
  chatSessions: ChatSession[];
  uploadTable: (file: File) => Promise<void>;
  getTable: (id: string) => Table | undefined;
  deleteTable: (id: string) => void;
  mergeTables: (
    tableIds: string[],
    name: string,
    joinType: 'inner' | 'outer' | 'left' | 'right',
    columnMappings: Record<string, string>
  ) => Promise<string>;
  createChatSession: (tableId: string, name?: string) => string;
  getChatSession: (id: string) => ChatSession | undefined;
  sendMessage: (sessionId: string, message: string) => Promise<void>;
  getTableColumns: (id: string) => Column[];
}

export const TablesContext = createContext<TablesContextType | undefined>(undefined);

export const TablesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const uploadTable = async (file: File) => {
    try {
      const text = await file.text();
      const { columns, data } = parseCSV(text);
      
      const newTable: Table = {
        id: `table-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'uploaded',
        createdAt: new Date(),
        columns,
        data,
        rowCount: data.length
      };
      
      setTables(prev => [...prev, newTable]);
      toast({
        title: "Table uploaded successfully",
        description: `${newTable.name} with ${data.length} rows has been added to your workspace.`
      });
    } catch (error) {
      console.error("Error uploading table:", error);
      toast({
        variant: "destructive",
        title: "Error uploading table",
        description: "Please check the file format and try again."
      });
    }
  };

  const getTable = (id: string) => tables.find(table => table.id === id);
  
  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(table => table.id !== id));
    setChatSessions(prev => prev.filter(session => session.tableId !== id));
    toast({
      title: "Table deleted",
      description: "The table and its associated chats have been removed."
    });
  };

  const mergeTables = async (
    tableIds: string[],
    name: string,
    joinType: 'inner' | 'outer' | 'left' | 'right',
    columnMappings: Record<string, string>
  ): Promise<string> => {
    const tablesToMerge = tableIds.map(id => getTable(id)).filter(Boolean) as Table[];
    
    try {
      const mergedTable = performTableMerge(tablesToMerge, name, joinType, columnMappings);
      setTables(prev => [...prev, mergedTable]);
      toast({
        title: "Tables merged successfully",
        description: `${mergedTable.name} with ${mergedTable.data.length} rows has been created.`
      });
      return mergedTable.id;
    } catch (error) {
      console.error("Error merging tables:", error);
      toast({
        variant: "destructive",
        title: "Error merging tables",
        description: error instanceof Error ? error.message : "An error occurred while merging tables."
      });
      throw error;
    }
  };

  const createChatSession = (tableId: string, name?: string): string => {
    const table = getTable(tableId);
    if (!table) {
      toast({
        variant: "destructive",
        title: "Error creating chat session",
        description: "The selected table could not be found."
      });
      return '';
    }
    
    const newSession = createNewChatSession(table, name);
    setChatSessions(prev => [...prev, newSession]);
    return newSession.id;
  };

  const getChatSession = (id: string) => chatSessions.find(session => session.id === id);

  const sendMessage = async (sessionId: string, message: string) => {
    const session = getChatSession(sessionId);
    if (!session) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: "The chat session could not be found."
      });
      return;
    }
    
    const table = getTable(session.tableId);
    if (!table) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: "The associated table could not be found."
      });
      return;
    }
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setChatSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    setTimeout(() => {
      const aiResponse = processAIResponse(message, table);
      const systemMessage = {
        id: `msg-${Date.now()}`,
        role: 'system' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, systemMessage] };
        }
        return s;
      }));
    }, 1000);
  };

  const getTableColumns = (id: string) => {
    const table = getTable(id);
    return table ? table.columns : [];
  };

  const contextValue: TablesContextType = {
    tables,
    chatSessions,
    uploadTable,
    getTable,
    deleteTable,
    mergeTables,
    createChatSession,
    getChatSession,
    sendMessage,
    getTableColumns
  };

  return (
    <TablesContext.Provider value={contextValue}>
      {children}
    </TablesContext.Provider>
  );
};

export const useTables = () => {
  const context = useContext(TablesContext);
  if (context === undefined) {
    throw new Error('useTables must be used within a TablesProvider');
  }
  return context;
};
