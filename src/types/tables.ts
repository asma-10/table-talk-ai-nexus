
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
