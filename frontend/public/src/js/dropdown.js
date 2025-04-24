document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const dropdown = this.closest('.dropdown');
      dropdown.querySelector('.dropdown-content').classList.toggle('show');
    });
  });
  
  // Fechar ao clicar fora
  window.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-content').forEach(content => {
      content.classList.remove('show');
    });
  });