
import { toast } from '@/hooks/use-toast';

interface MergeData {
  name: string;
  tables: any[];
  joinType: string;
  columnMappings: Record<string, string>;
}

interface WebhookData {
  name: string;
  email: string;
  service: string;
  mergeData?: MergeData;
}

export const sendDataToN8n = async (data: WebhookData): Promise<any> => {
  try {
    const response = await fetch('/api/webhooks/send-to-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending data to n8n:', error);
    // We'll handle the error in the calling component instead of showing a toast here
    throw error;
  }
};
