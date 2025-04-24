
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
    console.log('Sending data to n8n webhook:', data);
    
    const response = await fetch('/api/webhooks/send-to-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('N8n webhook response:', result);
    return result;
  } catch (error) {
    console.error('Error sending data to n8n:', error);
    // We'll handle the error in the calling component instead of showing a toast here
    throw error;
  }
};
