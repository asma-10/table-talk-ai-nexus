
// Toast component

const toast = {
  container() {
    return document.querySelector('.toast-container');
  },
  
  show(title, message, type = 'success', duration = 3000) {
    const container = this.container();
    if (!container) return;
    
    const id = Date.now();
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${type}`;
    toastElement.id = `toast-${id}`;
    
    toastElement.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toastElement);
    
    // Ajoute les événements
    const closeButton = toastElement.querySelector('.toast-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide(id));
    }
    
    // Auto-hide après duration
    if (duration) {
      setTimeout(() => this.hide(id), duration);
    }
  },
  
  hide(id) {
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.style.transform = 'translateX(100%)';
      toastElement.style.opacity = '0';
      
      setTimeout(() => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
      }, 300);
    }
  }
};
