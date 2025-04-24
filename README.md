
# TableTalk - AI Data Nexus

Une application pour charger, fusionner et discuter avec vos données tabulaires. Cette version utilise une architecture HTML/CSS/JavaScript vanilla pour le frontend et FastAPI pour le backend.

## Structure du projet

```
/tabletalk-app/
  /frontend/          # Code HTML/CSS/JavaScript vanilla
    /static/          # Ressources statiques (CSS, JS, assets)
    /templates/       # Pages HTML
  /backend/           # API FastAPI
    /app/             # Code source du backend
    requirements.txt  # Dépendances Python
```

## Installation et démarrage

### Backend (FastAPI)

1. Aller dans le répertoire backend:
   ```
   cd backend
   ```

2. Créer et activer un environnement virtuel (recommandé):
   ```
   python -m venv env
   source env/bin/activate  # sous Linux/MacOS
   env\Scripts\activate     # sous Windows
   ```

3. Installer les dépendances:
   ```
   pip install -r requirements.txt
   ```

4. Démarrer le serveur:
   ```
   python -m app.main
   ```
   Le serveur API sera accessible à l'adresse http://localhost:8000

### Frontend

Pour le développement, vous pouvez utiliser n'importe quel serveur HTTP statique. Par exemple:

1. Aller dans le répertoire frontend:
   ```
   cd frontend
   ```

2. Utiliser le module http.server de Python:
   ```
   python -m http.server 3000
   ```
   Le frontend sera accessible à l'adresse http://localhost:3000

## Intégration avec n8n

Cette application est conçue pour être facilement intégrée avec n8n:

1. Les points d'API REST peuvent être utilisés directement dans les workflows n8n.
2. Le backend inclut des points d'intégration prévus dans `config.py` pour les webhooks n8n.
3. Pour connecter à n8n, configurez la variable d'environnement `N8N_WEBHOOK_URL` ou modifiez directement le fichier `config.py`.

## Fonctionnalités

- Téléchargement et visualisation de données tabulaires (CSV)
- Fusion de tables avec différents types de jointures
- Chat interactif avec les données
- Interface utilisateur responsive et intuitive
- API RESTful complète pour l'intégration avec d'autres systèmes

## Technologies utilisées

- **Frontend**: HTML, CSS, JavaScript vanilla
- **Backend**: FastAPI (Python)
- **Données**: Traitement CSV, manipulation de données tabulaires
