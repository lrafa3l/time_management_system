// Script para toggle da sidebar em mobile
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    // Verifica se os elementos existem antes de continuar
    if (!menuToggle || !sidebar) return;

    // Mostrar/ocultar botão de toggle baseado no tamanho da tela
    function checkScreenSize() {
        if (window.innerWidth <= 576) {
            menuToggle.style.display = 'block';

            // Adiciona event listener apenas quando necessário
            menuToggle.addEventListener('click', toggleSidebar);
        } else {
            menuToggle.style.display = 'none';
            sidebar.classList.remove('active');

            // Remove event listener quando não for necessário
            menuToggle.removeEventListener('click', toggleSidebar);
        }
    }

    // Função para alternar a sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
    }

    // Fechar sidebar ao clicar em um item (opcional)
    function setupNavItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 576) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Verificar tamanho da tela ao carregar e redimensionar
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    // Configurar os itens de navegação
    setupNavItems();
});