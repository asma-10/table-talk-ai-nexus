
// Navbar component

function renderNavbar(element) {
  if (!element) return;
  
  element.innerHTML = `
    <div class="container">
      <a href="/" class="navbar-brand">TableTalk</a>
      <ul class="navbar-menu">
        <li class="navbar-item">
          <a href="/" class="navbar-link">Dashboard</a>
        </li>
        <li class="navbar-item">
          <a href="/tables" class="navbar-link">Tables</a>
        </li>
      </ul>
    </div>
  `;
  
  // Ajoute la classe active au lien actuel
  const currentPath = window.location.pathname;
  const links = element.querySelectorAll('.navbar-link');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });
}
