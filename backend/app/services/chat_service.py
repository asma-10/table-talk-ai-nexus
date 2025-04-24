
from typing import Dict, Any
from app.models.tables import Table

def process_ai_response(message: str, table: Table) -> str:
    """
    Generate AI response based on the message and table data
    This is a simplified version that mimics the original implementation
    In production, integrate with an actual AI service or LLM
    """
    message_lower = message.lower()
    
    if "how many" in message_lower:
        return f"Il y a {table.rowCount} lignes dans ce tableau."
    
    elif "column" in message_lower or "fields" in message_lower or "colonnes" in message_lower:
        column_headers = [c.header for c in table.columns]
        return f"Le tableau contient les colonnes suivantes : {', '.join(column_headers)}."
    
    elif "average" in message_lower or "mean" in message_lower or "moyenne" in message_lower:
        numeric_columns = [col for col in table.columns if col.type == "number"]
        if numeric_columns:
            col = numeric_columns[0]
            values = [float(row.get(col.accessor, 0)) for row in table.data]
            if values:
                avg = sum(values) / len(values)
                return f"La moyenne de {col.header} est {avg:.2f}."
        return "Je n'ai pas trouvé de colonne numérique pour calculer la moyenne."
    
    elif "max" in message_lower or "maximum" in message_lower:
        numeric_columns = [col for col in table.columns if col.type == "number"]
        if numeric_columns:
            col = numeric_columns[0]
            values = [float(row.get(col.accessor, 0)) for row in table.data]
            if values:
                max_val = max(values)
                return f"La valeur maximale de {col.header} est {max_val}."
        return "Je n'ai pas trouvé de colonne numérique pour calculer la valeur maximale."
    
    return "Je suis votre assistant de données AI. Vous pouvez me poser des questions sur ce tableau comme compter les lignes, trouver des informations sur les colonnes, calculer des moyennes ou trouver des valeurs maximales."
