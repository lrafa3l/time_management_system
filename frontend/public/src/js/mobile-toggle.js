document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    // Verifica se os elementos existem
    if (!menuToggle || !sidebar) {
        console.error('menuToggle or sidebar not found');
        return;
    }

    // Função para alternar a sidebar e o ícone do botão
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        menuToggle.classList.toggle('active');
        console.log('Button classes:', menuToggle.classList);
        console.log('Close icon display:', document.querySelector('.close-icon').style.display);
    }

    // Mostrar/ocultar botão de toggle baseado no tamanho da tela
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
            // Adiciona o event listener apenas se ainda não foi adicionado
            if (!menuToggle.dataset.listenerAdded) {
                menuToggle.addEventListener('click', toggleSidebar);
                menuToggle.dataset.listenerAdded = 'true';
                console.log('Click listener added');
            }
        } else {
            menuToggle.style.display = 'none';
            menuToggle.style.zIndex = '100';
            sidebar.classList.remove('active');
            menuToggle.classList.remove('active');
            console.log('Reset: Button classes:', menuToggle.classList);
        }
    }

    // Fechar sidebar ao clicar em um item
    function setupNavItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 576) {
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('active');
                    console.log('Nav item clicked, button classes:', menuToggle.classList);
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