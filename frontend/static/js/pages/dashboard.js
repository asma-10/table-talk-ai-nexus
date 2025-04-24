
// Dashboard page script

function initDashboard() {
  // Récupère les tables récentes
  fetchRecentTables();
}

async function fetchRecentTables() {
  const recentTablesContainer = document.getElementById('recentTables');
  
  if (!recentTablesContainer) return;
  
  try {
    const tables = await api.getTables();
    appState.tables = tables;
    
    // Prend les 4 tables les plus récentes
    const recentTables = tables.slice(0, 4);
    
    if (recentTables.length > 0) {
      recentTablesContainer.innerHTML = '';
      
      recentTables.forEach(table => {
        const tableCard = createTableCard(table);
        recentTablesContainer.appendChild(tableCard);
      });
    } else {
      recentTablesContainer.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">Aucune table disponible.</p>
          <a href="/tables" class="button outline">
            Télécharger votre première table
            <span class="icon">→</span>
          </a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tables récentes:', error);
    toast.show('Erreur', 'Impossible de charger les tables récentes', 'error');
    
    recentTablesContainer.innerHTML = `
      <div class="error-state">
        <p>Impossible de charger les tables. Veuillez réessayer plus tard.</p>
      </div>
    `;
  }
}
