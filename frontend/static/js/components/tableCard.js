
// Table Card component

function createTableCard(table) {
  const card = document.createElement('div');
  card.className = 'card table-card';
  
  const createdAt = new Date(table.createdAt).toLocaleDateString();
  
  card.innerHTML = `
    <div class="card-title">${table.name}</div>
    <div class="table-meta">
      ${table.type === 'merged' ? 'Merged • ' : 'Uploaded • '}
      ${table.rowCount} rows • ${table.columns.length} columns
      <br>
      <small>Created: ${createdAt}</small>
    </div>
    <div class="table-actions">
      <a href="/table/${table.id}" class="button outline">
        View table
      </a>
    </div>
  `;
  
  return card;
}
