
import { ChatSession, Table } from '../types/tables';
import { toast } from '@/components/ui/use-toast';

export const createNewChatSession = (
  table: Table,
  name?: string
): ChatSession => {
  const sessionId = `chat-${Date.now()}`;
  return {
    id: sessionId,
    tableId: table.id,
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
};

export const processAIResponse = (message: string, table: Table): string => {
  // For MVP, generate simple responses based on the query
  if (message.toLowerCase().includes('how many')) {
    return `There are ${table.rowCount} rows in this table.`;
  } else if (message.toLowerCase().includes('column') || message.toLowerCase().includes('fields')) {
    return `The table has the following columns: ${table.columns.map(c => c.header).join(', ')}.`;
  } else if (message.toLowerCase().includes('average') || message.toLowerCase().includes('mean')) {
    const numericColumns = table.columns.filter(col => col.type === 'number');
    if (numericColumns.length > 0) {
      const column = numericColumns[0];
      const sum = table.data.reduce((acc, row) => acc + (parseFloat(row[column.accessor]) || 0), 0);
      const avg = (sum / table.rowCount).toFixed(2);
      return `The average of ${column.header} is ${avg}.`;
    }
    return "I couldn't find a numeric column to calculate the average.";
  } else if (message.toLowerCase().includes('max')) {
    const numericColumns = table.columns.filter(col => col.type === 'number');
    if (numericColumns.length > 0) {
      const column = numericColumns[0];
      const max = Math.max(...table.data.map(row => parseFloat(row[column.accessor]) || 0));
      return `The maximum value in ${column.header} is ${max}.`;
    }
    return "I couldn't find a numeric column to calculate the maximum value.";
  }
  return "I'm your AI data assistant. You can ask me questions about this table such as counting rows, finding column information, calculating averages, or finding maximum values.";
};
