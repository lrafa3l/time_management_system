document.addEventListener("DOMContentLoaded", function () {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
        authDomain: "schedule-system-8c4b6.firebaseapp.com",
        databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
        projectId: "schedule-system-8c4b6",
        storageBucket: "schedule-system-8c4b6.firebasestorage.app",
        messagingSenderId: "1056197912318",
        appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
        measurementId: "G-GHEY7QZEQ9"
    };

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // DOM elements
    const docentesList = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    const searchInput = document.getElementById('search-docentes');
    const paginationNav = document.querySelector('.pagination-nav');
    const professorModal = document.getElementById('professor-modal');

    // Check DOM elements
    if (!docentesList) console.error('Docentes list not found');
    if (!searchInput) console.error('Search input not found');
    if (!paginationNav) console.error('Pagination nav not found');
    if (!professorModal) console.error('Professor modal not found');

    // Pagination state
    let currentPage = 1;
    const cardsPerPage = 6;
    let allProfessores = [];
    let filteredProfessores = [];
    let disciplinasMap = {};

    // Color scheme for avatars
    const avatarColors = [
        { bgLight: 'bg-blue-100', bgDark: 'bg-blue-900', textLight: 'text-blue-600', textDark: 'text-blue-300' },
        { bgLight: 'bg-yellow-100', bgDark: 'bg-yellow-900', textLight: 'text-yellow-600', textDark: 'text-yellow-300' },
        { bgLight: 'bg-red-100', bgDark: 'bg-red-900', textLight: 'text-red-600', textDark: 'text-red-300' },
        { bgLight: 'bg-green-100', bgDark: 'bg-green-900', textLight: 'text-green-600', textDark: 'text-green-300' },
        { bgLight: 'bg-purple-100', bgDark: 'bg-purple-900', textLight: 'text-purple-600', textDark: 'text-purple-300' },
        { bgLight: 'bg-orange-100', bgDark: 'bg-orange-900', textLight: 'text-orange-600', textDark: 'text-orange-300' },
        { bgLight: 'bg-teal-100', bgDark: 'bg-teal-900', textLight: 'text-teal-600', textDark: 'text-teal-300' },
        { bgLight: 'bg-pink-100', bgDark: 'bg-pink-900', textLight: 'text-pink-600', textDark: 'text-pink-300' }
    ];

    // Fetch disciplines for mapping IDs to names
    async function fetchDisciplinas() {
        try {
            const snapshot = await db.collection('disciplinas').get();
            const map = {};
            snapshot.forEach(doc => {
                map[doc.id] = doc.data().nome || 'Sem Nome';
            });
            console.log('Disciplinas Map:', map);
            return map;
        } catch (error) {
            console.error('Erro ao carregar disciplinas:', error);
            return {};
        }
    }

    // Show professor details in modal
    function showProfessorModal(professor) {
        if (!professorModal) {
            console.error('Professor modal element not found');
            return;
        }

        console.log('Showing modal for:', professor.nome);
        console.log('Professor classe:', professor.classes);
        const initials = professor.nome
            .split(' ')
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase();

        const disciplinaNome = Array.isArray(professor.disciplinas) && professor.disciplinas.length > 0
            ? professor.disciplinas
                .map(id => disciplinasMap[id] || 'Desconhecida')
                .filter(nome => nome !== 'Desconhecida')
                .join(', ') || 'Não informado'
            : 'Não informado';

        const classeLeciona = Array.isArray(professor.classes) && professor.classes.length > 0
            ? professor.classes.join(', ') || 'Não informado'
            : 'Não informado';
        console.log('Classe Leciona:', classeLeciona);

        try {
            document.getElementById('modal-professor-initials').textContent = initials;
            document.getElementById('modal-professor-name').textContent = professor.nome || 'Não informado';
            document.getElementById('modal-professor-fullname').textContent = professor.nome || 'Não informado';
            document.getElementById('modal-professor-email').textContent = professor.email || 'Não informado';
            document.getElementById('modal-professor-contacto').textContent = professor.contacto || 'Não informado';
            document.getElementById('modal-professor-formacao-medio').textContent = professor.formacaoMedio || 'Não informado';
            document.getElementById('modal-professor-habilitacoes-superior').textContent = professor.habilitacoes || 'Não informado';
            document.getElementById('modal-professor-unidade-organica').textContent = professor.unidade || 'Não informado';
            document.getElementById('modal-professor-categoria').textContent = professor.categoria || 'Não informado';
            document.getElementById('modal-professor-classe-leciona').textContent = classeLeciona;
            document.getElementById('modal-professor-disciplinas').textContent = disciplinaNome;
            document.getElementById('modal-professor-cargo-funcao').textContent = professor.cargo || 'Não informado';
            professorModal.classList.remove('hidden');
            console.log('Modal shown');
        } catch (e) {
            console.error('Error populating modal:', e);
        }
    }

    // Hide modal
    function hideProfessorModal() {
        if (professorModal) {
            professorModal.classList.add('hidden');
            console.log('Modal hidden');
        }
    }

    // Fetch and render professors
    async function loadProfessores() {
        console.log('Starting loadProfessores');
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('Usuário não autenticado');
                if (docentesList) {
                    docentesList.innerHTML = '<p class="text-center text-gray-500">Por favor, inicie sessão.</p>';
                }
                console.log('Dispatching dataLoaded: no user');
                document.dispatchEvent(new Event('dataLoaded'));
                return;
            }

            disciplinasMap = await fetchDisciplinas();
            const snapshot = await db.collection('professores')
                .where('userId', '==', user.uid)
                .orderBy('nome')
                .get();

            if (snapshot.empty) {
                console.log('No professors found');
                if (docentesList) {
                    docentesList.innerHTML = '<p class="text-center text-gray-500">Nenhum docente encontrado.</p>';
                }
                console.log('Dispatching dataLoaded: empty snapshot');
                document.dispatchEvent(new Event('dataLoaded'));
                return;
            }

            allProfessores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            filteredProfessores = [...allProfessores];
            console.log('Professores Data:', allProfessores.map(p => ({ nome: p.nome, disciplinas: p.disciplinas, classe: p.classes })));

            renderPage(1);
            console.log('Dispatching dataLoaded: success');
            document.dispatchEvent(new Event('dataLoaded'));
        } catch (error) {
            console.error('Erro ao carregar professores:', error);
            let errorMessage = 'Erro ao carregar docentes. Tente novamente.';
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                errorMessage = 'Erro: Índice do Firestore necessário. Crie o índice no Firebase Console e tente novamente.';
            }
            if (docentesList) {
                docentesList.innerHTML = `<p class="text-center text-red-500">${errorMessage}</p>`;
            }
            console.log('Dispatching dataLoaded: error');
            document.dispatchEvent(new Event('dataLoaded'));
        }
    }

    // Render professor cards for the current page
    function renderProfessores(professores, startIndex) {
        console.log('Rendering professors:', professores.length);
        if (!docentesList) {
            console.error('Docentes list element missing');
            return;
        }
        docentesList.innerHTML = '';
        professores.forEach((professor, index) => {
            const initials = professor.nome
                .split(' ')
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase();

            const disciplinaNome = Array.isArray(professor.disciplinas) && professor.disciplinas.length > 0
                ? professor.disciplinas
                    .map(id => disciplinasMap[id] || 'Desconhecida')
                    .filter(nome => nome !== 'Desconhecida')
                    .join(', ') || 'N/A'
                : 'N/A';
            console.log(`Professor ${professor.nome}: Disciplinas=${JSON.stringify(professor.disciplinas)}, Nome=${disciplinaNome}`);

            const colorIndex = (startIndex + index) % avatarColors.length;
            const color = avatarColors[colorIndex];

            const card = `
                <div class="docente-card bg-white dark:bg-[#ffffff] rounded-lg shadow p-6" data-nome="${professor.nome.toLowerCase()}">
                    <div class="flex items-center space-x-4 mb-4">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 rounded-full ${color.bgLight} dark:${color.bgDark} flex items-center justify-center">
                                <span class="${color.textLight} dark:${color.textDark} font-medium text-lg">${initials}</span>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="name text-lg font-semibold text-gray-900 dark:text-white truncate">${professor.nome}</h3>
                            <p class="text-sm text-gray-500 dark:text-[#29a8dc] truncate">${disciplinaNome}</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <i class="fas fa-envelope text-[#29a8dc] mr-2"></i>
                            <span class="text-sm text-gray-600 dark:text-[#29a8dc]">${professor.email || 'N/A'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-phone text-[#29a8dc] mr-2"></i>
                            <span class="text-sm text-gray-600 dark:text-[#29a8dc]">${professor.contacto || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="mt-4 flex space-x-2">
                        <button class="contact-btn flex-1 bg-[#29a8dc] font-semibold hover:bg-[#2195c3] text-[#ffffff] py-2 px-4 rounded-lg text-sm flex items-center justify-center">
                            Ver mais
                        </button>
                    </div>
                </div>
            `;
            try {
                docentesList.insertAdjacentHTML('beforeend', card);
                const button = docentesList.querySelector(`.docente-card:last-child .contact-btn`);
                button.addEventListener('click', () => {
                    console.log('Ver mais clicked for:', professor.nome);
                    showProfessorModal(professor);
                });
            } catch (e) {
                console.error('Error rendering card for', professor.nome, ':', e);
            }
        });
        console.log('Finished rendering professors');
    }

    // Render pagination controls
    function renderPagination(totalItems) {
        console.log('Rendering pagination for', totalItems, 'items');
        if (!paginationNav) {
            console.error('Pagination nav not found');
            return;
        }
        const totalPages = Math.ceil(totalItems / cardsPerPage);
        paginationNav.innerHTML = '';

        const prevButton = document.createElement('a');
        prevButton.href = '#';
        prevButton.className = `px-3 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-[#ffffff] text-gray-500 dark:text-[#29a8dc] hover:bg-[#d7faff] dark:hover:bg-[#d7faff] ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        if (currentPage > 1) {
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(currentPage - 1);
            });
        }
        paginationNav.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('a');
            pageButton.href = '#';
            pageButton.className = `px-4 py-2 border border-gray-300 bg-white ${i === currentPage ? 'dark:bg-[#d7faff] text-[#29a8dc] bg-blue-500 dark:text-[#29a8dc] dark:bg-[#d7faff]' : 'dark:bg-[#ffffff] text-[#29a8dc] dark:text-[#29a8dc] hover:bg-[#d7faff] dark:hover:bg-[#d7faff]'}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(i);
            });
            paginationNav.appendChild(pageButton);
        }

        const nextButton = document.createElement('a');
        nextButton.href = '#';
        const nextButtonClasses = `px-3 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-[#ffffff] text-gray-500 dark:text-[#29a8dc] hover:bg-[#d7faff] dark:hover:bg-[#d7faff] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextButton.className = nextButtonClasses;
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage < totalPages) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(currentPage + 1);
            });
        }
        paginationNav.appendChild(nextButton);
        console.log('Pagination rendered');
    }

    // Change page and render
    function changePage(page) {
        console.log('Changing to page:', page);
        const totalPages = Math.ceil(filteredProfessores.length / cardsPerPage);
        currentPage = Math.max(1, Math.min(page, totalPages));
        renderPage(currentPage);
    }

    // Render current page
    function renderPage(page) {
        console.log('Rendering page:', page);
        const startIndex = (page - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const pageProfessores = filteredProfessores.slice(startIndex, endIndex);
        renderProfessores(pageProfessores, startIndex);
        renderPagination(filteredProfessores.length);
    }

    // Search functionality
    function setupSearch() {
        if (!searchInput) {
            console.error('Search input not found');
            return;
        }
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            console.log('Search term:', searchTerm);
            filteredProfessores = allProfessores.filter(professor =>
                professor.nome.toLowerCase().includes(searchTerm)
            );
            currentPage = 1;
            renderPage(1);
        });
    }

    // Setup modal close buttons
    function setupModalCloseButtons() {
        const closeIconButtons = document.querySelectorAll('.modal-close-btn');
        const closeFooterButtons = document.querySelectorAll('.modal-footer-close-btn');
        closeIconButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Close icon clicked');
                hideProfessorModal();
            });
        });
        closeFooterButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Fechar button clicked');
                hideProfessorModal();
            });
        });
    }

    // Initialize
    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state changed:', user ? user.uid : 'no user');
        if (user) {
            loadProfessores();
            setupSearch();
            setupModalCloseButtons();
        } else {
            console.log('No user, showing login message');
            if (docentesList) {
                docentesList.innerHTML = '<p class="text-center text-gray-500">Por favor, inicie sessão.</p>';
            }
            console.log('Dispatching dataLoaded: no user (init)');
            document.dispatchEvent(new Event('dataLoaded'));
        }
    });
});