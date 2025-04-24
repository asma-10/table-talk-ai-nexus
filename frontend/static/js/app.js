
// Application principale

// État global de l'application
const appState = {
  currentView: null,
  tables: [],
  chatSessions: [],
  isLoading: false,
  toasts: [],
};

// Router simple
const router = {
  routes: {
    '/': 'dashboard',
    '/tables': 'tables',
    '/table/': 'tableView',
    '/chat/': 'chatView',
  },
  
  init() {
    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('/')) {
          e.preventDefault();
          history.pushState(null, '', href);
          this.handleRoute();
        }
      }
    });
    
    this.handleRoute();
  },
  
  handleRoute() {
    const path = window.location.pathname;
    let match = false;
    
    for (const route in this.routes) {
      if (path === route || (route !== '/' && path.startsWith(route))) {
        this.loadView(this.routes[route], path);
        match = true;
        break;
      }
    }
    
    if (!match) {
      this.loadView('notFound');
    }
  },
  
  loadView(viewName, path) {
    appState.currentView = viewName;
    
    // Nettoie le contenu actuel
    const appElement = document.getElementById('app');
    
    // Charge le contenu approprié
    switch (viewName) {
      case 'dashboard':
        fetch('/templates/dashboard.html')
          .then(response => response.text())
          .then(html => {
            appElement.innerHTML = html;
            initDashboard();
          });
        break;
        
      case 'tables':
        fetch('/templates/tables.html')
          .then(response => response.text())
          .then(html => {
            appElement.innerHTML = html;
            initTables();
          });
        break;
        
      case 'tableView':
        const tableId = path.split('/').pop();
        fetch('/templates/tableView.html')
          .then(response => response.text())
          .then(html => {
            appElement.innerHTML = html;
            initTableView(tableId);
          });
        break;
        
      case 'chatView':
        const chatId = path.split('/').pop();
        fetch('/templates/chatView.html')
          .then(response => response.text())
          .then(html => {
            appElement.innerHTML = html;
            initChatView(chatId);
          });
        break;
        
      default:
        fetch('/templates/notFound.html')
          .then(response => response.text())
          .then(html => {
            appElement.innerHTML = html;
          });
        break;
    }
    
    // Initialise les composants communs
    initializeComponents();
  },
  
  navigateTo(path) {
    history.pushState(null, '', path);
    this.handleRoute();
  }
};

// Initialisation des composants communs
function initializeComponents() {
  // Initialise la barre de navigation
  const navbarElement = document.querySelector('.navbar');
  if (navbarElement) {
    renderNavbar(navbarElement);
  }
  
  // Initialise le système de toast
  const toasterElement = document.getElementById('toaster');
  if (toasterElement) {
    toasterElement.innerHTML = '<div class="toast-container"></div>';
  }
}

// Point d'entrée de l'application
document.addEventListener('DOMContentLoaded', () => {
  // Initialise le router
  router.init();
});
