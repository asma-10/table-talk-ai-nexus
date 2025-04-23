
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Column {
  accessor: string;
  header: string;
  type: 'string' | 'number' | 'boolean' | 'date';
}

export interface Table {
  id: string;
  name: string;
  type: 'uploaded' | 'merged';
  createdAt: Date;
  lastAccessed?: Date;
  columns: Column[];
  data: Record<string, any>[];
  parentTables?: string[]; // For merged tables
  rowCount: number;
}

export interface ChatSession {
  id: string;
  tableId: string;
  name: string;
  createdAt: Date;
  messages: {
    id: string;
    role: 'user' | 'system';
    content: string;
    timestamp: Date;
  }[];
}

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

  // Helper function to parse CSV data
  const parseCSV = (csvText: string): { columns: Column[], data: Record<string, any>[] } => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(header => header.trim());
    
    const columns = headers.map(header => ({
      accessor: header,
      header,
      type: 'string' as const
    }));
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim());
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Try to determine type
        if (!isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
          // Update column type if not already set to number
          if (columns[index].type !== 'number') {
            columns[index].type = 'number';
          }
        } else {
          row[header] = value;
        }
      });
      
      return row;
    });
    
    return { columns, data };
  };

  // Upload a new table from a file
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

  // Get a table by ID
  const getTable = (id: string) => {
    return tables.find(table => table.id === id);
  };

  // Delete a table by ID
  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(table => table.id !== id));
    // Also delete any chat sessions associated with this table
    setChatSessions(prev => prev.filter(session => session.tableId !== id));
    toast({
      title: "Table deleted",
      description: "The table and its associated chats have been removed."
    });
  };

  // Merge tables based on join type and column mappings
  const mergeTables = async (
    tableIds: string[],
    name: string,
    joinType: 'inner' | 'outer' | 'left' | 'right',
    columnMappings: Record<string, string>
  ): Promise<string> => {
    // Simple implementation for MVP
    const tablesToMerge = tableIds.map(id => getTable(id)).filter(Boolean) as Table[];
    
    if (tablesToMerge.length < 2) {
      throw new Error("Need at least two tables to merge");
    }
    
    let mergedData: Record<string, any>[] = [];
    const baseTable = tablesToMerge[0];
    const secondTable = tablesToMerge[1];
    
    // For MVP, only implement inner join on two tables
    if (joinType === 'inner') {
      // Get the mapped columns
      const mappingKeys = Object.keys(columnMappings);
      
      // Simple inner join
      mergedData = baseTable.data.reduce((acc, baseRow) => {
        const matches = secondTable.data.filter(secondRow => {
          // Check if all mapping conditions are met
          return mappingKeys.every(baseCol => 
            baseRow[baseCol] === secondRow[columnMappings[baseCol]]
          );
        });
        
        if (matches.length > 0) {
          matches.forEach(match => {
            const newRow = { ...baseRow };
            
            // Add all columns from the second table (except mapped ones)
            Object.keys(match).forEach(key => {
              // Skip columns that are already mapped to avoid duplication
              if (!Object.values(columnMappings).includes(key)) {
                // Avoid name collisions by prefixing if needed
                const newKey = baseRow.hasOwnProperty(key) ? `${secondTable.name}_${key}` : key;
                newRow[newKey] = match[key];
              }
            });
            
            acc.push(newRow);
          });
        }
        
        return acc;
      }, [] as Record<string, any>[]);
    } else {
      // For MVP, just handle inner join for now
      mergedData = baseTable.data;
    }
    
    // Create combined list of columns
    let mergedColumns: Column[] = [...baseTable.columns];
    
    // Add columns from second table, avoiding duplicates from mappings
    secondTable.columns.forEach(col => {
      const mappedValues = Object.values(columnMappings);
      
      if (!mappedValues.includes(col.accessor)) {
        // Check if there's a name collision
        const existingCol = mergedColumns.find(c => c.accessor === col.accessor);
        if (existingCol) {
          // Use prefixed name
          mergedColumns.push({
            ...col,
            accessor: `${secondTable.name}_${col.accessor}`,
            header: `${secondTable.name} ${col.header}`
          });
        } else {
          mergedColumns.push(col);
        }
      }
    });
    
    const mergedTable: Table = {
      id: `merged-${Date.now()}`,
      name: name || `Merged Table ${tables.filter(t => t.type === 'merged').length + 1}`,
      type: 'merged',
      createdAt: new Date(),
      columns: mergedColumns,
      data: mergedData,
      parentTables: tableIds,
      rowCount: mergedData.length
    };
    
    setTables(prev => [...prev, mergedTable]);
    toast({
      title: "Tables merged successfully",
      description: `${mergedTable.name} with ${mergedData.length} rows has been created.`
    });
    
    return mergedTable.id;
  };

  // Create a new chat session
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
    
    const sessionId = `chat-${Date.now()}`;
    const newSession: ChatSession = {
      id: sessionId,
      tableId,
      name: name || `Chat about ${table.name}`,
      createdAt: new Date(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `This is an AI assistant to help you analyze the table: ${table.name}. Ask any questions about the data.`,
          timestamp: new Date()
        }
      ]
    };
    
    setChatSessions(prev => [...prev, newSession]);
    return sessionId;
  };

  // Get a chat session by ID
  const getChatSession = (id: string) => {
    return chatSessions.find(session => session.id === id);
  };

  // Send a message in a chat session
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
    
    // Add user message
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

    // For MVP, simulate an AI response
    setTimeout(() => {
      // Process the message to provide a simple AI response
      let aiResponse = "";
      
      if (message.toLowerCase().includes('how many')) {
        aiResponse = `There are ${table.rowCount} rows in this table.`;
      } else if (message.toLowerCase().includes('column') || message.toLowerCase().includes('fields')) {
        aiResponse = `The table has the following columns: ${table.columns.map(c => c.header).join(', ')}.`;
      } else if (message.toLowerCase().includes('average') || message.toLowerCase().includes('mean')) {
        // Try to find a numeric column for an average calculation
        const numericColumns = table.columns.filter(col => col.type === 'number');
        if (numericColumns.length > 0) {
          const column = numericColumns[0];
          const sum = table.data.reduce((acc, row) => acc + (parseFloat(row[column.accessor]) || 0), 0);
          const avg = (sum / table.rowCount).toFixed(2);
          aiResponse = `The average of ${column.header} is ${avg}.`;
        } else {
          aiResponse = "I couldn't find a numeric column to calculate the average.";
        }
      } else if (message.toLowerCase().includes('max')) {
        // Find max value in a numeric column
        const numericColumns = table.columns.filter(col => col.type === 'number');
        if (numericColumns.length > 0) {
          const column = numericColumns[0];
          const max = Math.max(...table.data.map(row => parseFloat(row[column.accessor]) || 0));
          aiResponse = `The maximum value in ${column.header} is ${max}.`;
        } else {
          aiResponse = "I couldn't find a numeric column to calculate the maximum value.";
        }
      } else {
        aiResponse = "I'm your AI data assistant. You can ask me questions about this table such as counting rows, finding column information, calculating averages, or finding maximum values.";
      }
      
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

  // Get columns for a table
  const getTableColumns = (id: string): Column[] => {
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
