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

    // Pagination state
    let currentPage = 1;
    const cardsPerPage = 6;
    let allProfessores = [];
    let filteredProfessores = [];
    let disciplinasMap = {}; // Store disciplines map globally

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

    // Fetch and render professors
    async function loadProfessores() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('Usuário não autenticado');
                docentesList.innerHTML = '<p class="text-center text-gray-500">Por favor, inicie sessão.</p>';
                console.log('Dispatching dataLoaded: no user');
                document.dispatchEvent(new Event('dataLoaded'));
                return;
            }

            disciplinasMap = await fetchDisciplinas(); // Store globally
            const snapshot = await db.collection('professores')
                .where('userId', '==', user.uid)
                .orderBy('nome')
                .get();

            if (snapshot.empty) {
                docentesList.innerHTML = '<p class="text-center text-gray-500">Nenhum docente encontrado.</p>';
                console.log('Dispatching dataLoaded: empty snapshot');
                document.dispatchEvent(new Event('dataLoaded'));
                return;
            }

            allProfessores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            filteredProfessores = [...allProfessores];
            console.log('Professores Data:', allProfessores.map(p => ({ nome: p.nome, disciplinas: p.disciplinas })));

            renderPage(1);
            console.log('Dispatching dataLoaded: success');
            document.dispatchEvent(new Event('dataLoaded'));
        } catch (error) {
            console.error('Erro ao carregar professores:', error);
            let errorMessage = 'Erro ao carregar docentes. Tente novamente.';
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                errorMessage = 'Erro: Índice do Firestore necessário. Crie o índice no Firebase Console e tente novamente.';
            }
            docentesList.innerHTML = `<p class="text-center text-red-500">${errorMessage}</p>`;
            console.log('Dispatching dataLoaded: error');
            document.dispatchEvent(new Event('dataLoaded'));
        }
    }

    // Render professor cards for the current page
    function renderProfessores(professores, startIndex) {
        docentesList.innerHTML = '';
        professores.forEach((professor, index) => {
            // Get initials from nome
            const initials = professor.nome
                .split(' ')
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase();

            // Get discipline names (join multiple if present)
            let disciplinaNome = 'N/A';
            if (Array.isArray(professor.disciplinas) && professor.disciplinas.length > 0) {
                const nomes = professor.disciplinas
                    .map(id => disciplinasMap[id] || 'Desconhecida')
                    .filter(nome => nome !== 'Desconhecida');
                disciplinaNome = nomes.length > 0 ? nomes.join(', ') : 'N/A';
            }
            console.log(`Professor ${professor.nome}: Disciplinas=${JSON.stringify(professor.disciplinas)}, Nome=${disciplinaNome}`);

            // Rotate through avatar colors, accounting for page
            const colorIndex = (startIndex + index) % avatarColors.length;
            const color = avatarColors[colorIndex];

            // Generate card HTML
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
            docentesList.insertAdjacentHTML('beforeend', card);
        });
    }

    // Render pagination controls
    function renderPagination(totalItems) {
        if (!paginationNav) {
            console.error('Pagination nav not found');
            return;
        }
        const totalPages = Math.ceil(totalItems / cardsPerPage);
        paginationNav.innerHTML = '';

        // Previous button
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

        // Page numbers
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

        // Next button
        const nextButton = document.createElement('a');
        nextButton.href = '#';
        nextButton.className = `px-3 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-[#ffffff] text-gray-500 dark:text-[#29a8dc] hover:bg-[#d7faff] dark:hover:bg-[#d7faff] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage < totalPages) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(currentPage + 1);
            });
        }
        paginationNav.appendChild(nextButton);
    }

    // Change page and render
    function changePage(page) {
        const totalPages = Math.ceil(filteredProfessores.length / cardsPerPage);
        currentPage = Math.max(1, Math.min(page, totalPages));
        renderPage(currentPage);
    }

    // Render current page
    function renderPage(page) {
        const startIndex = (page - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const pageProfessores = filteredProfessores.slice(startIndex, endIndex);
        renderProfessores(pageProfessores, startIndex);
        renderPagination(filteredProfessores.length);
    }

    // Search functionality
    function setupSearch() {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            filteredProfessores = allProfessores.filter(professor =>
                professor.nome.toLowerCase().includes(searchTerm)
            );
            currentPage = 1;
            renderPage(1);
        });
    }

    // Initialize
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadProfessores();
            setupSearch();
        } else {
            docentesList.innerHTML = '<p class="text-center text-gray-500">Por favor, inicie sessão.</p>';
            console.log('Dispatching dataLoaded: no user (init)');
            document.dispatchEvent(new Event('dataLoaded'));
        }
    });
});