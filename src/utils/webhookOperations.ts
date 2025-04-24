
import { toast } from "@/components/ui/use-toast";

interface UserData {
  name: string;
  email: string;
  service: string;
}

export const sendDataToN8n = async (userData: UserData) => {
  try {
    const response = await fetch("/api/webhooks/send-to-n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    toast({
      title: "Succès",
      description: "Les données ont été envoyées avec succès à n8n",
    });
    return result;
  } catch (error) {
    console.error("Erreur lors de l'envoi :", error);
    toast({
      title: "Erreur",
      description: "Erreur lors de l'envoi des données à n8n",
      variant: "destructive",
    });
    throw error;
  }
};

