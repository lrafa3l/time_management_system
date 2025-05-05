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
    const filterDepartment = document.getElementById('filter-department');

    // Department mapping (unidade to filter values)
    const departmentMapping = {
        'Dep. Tecnologias Móveis': 'tecnologias-moveis',
        'Dep. Informática': 'informatica',
        'Dep. Construção Civil': 'construcao-civil'
    };

    // Color scheme for avatars
    const avatarColors = [
        { bgLight: 'bg-blue-100', bgDark: 'bg-blue-900', textLight: 'text-blue-600', textDark: 'text-blue-300' },
        { bgLight: 'bg-yellow-100', bgDark: 'bg-yellow-900', textLight: 'text-yellow-600', textDark: 'text-yellow-300' },
        { bgLight: 'bg-red-100', bgDark: 'bg-red-900', textLight: 'text-red-600', textDark: 'text-red-300' },
        { bgLight: 'bg-green-100', bgDark: 'bg-green-900', textLight: 'text-green-600', textDark: 'text-green-300' }
    ];

    // Fetch disciplines for mapping IDs to names
    async function fetchDisciplinas() {
        try {
            const snapshot = await db.collection('disciplinas').get();
            const disciplinasMap = {};
            snapshot.forEach(doc => {
                disciplinasMap[doc.id] = doc.data().nome;
            });
            return disciplinasMap;
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
                return;
            }

            const disciplinasMap = await fetchDisciplinas();
            const snapshot = await db.collection('professores')
                .where('userId', '==', user.uid)
                .orderBy('nome')
                .get();

            if (snapshot.empty) {
                docentesList.innerHTML = '<p class="text-center text-gray-500">Nenhum docente encontrado.</p>';
                return;
            }

            const professores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            renderProfessores(professores, disciplinasMap);
        } catch (error) {
            console.error('Erro ao carregar professores:', error);
            let errorMessage = 'Erro ao carregar docentes. Tente novamente.';
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                errorMessage = 'Erro: Índice do Firestore necessário. Crie o índice no Firebase Console e tente novamente.';
            }
            docentesList.innerHTML = `<p class="text-center text-red-500">${errorMessage}</p>`;
        }
    }

    // Render professor cards
    function renderProfessores(professores, disciplinasMap) {
        docentesList.innerHTML = '';
        professores.forEach((professor, index) => {
            // Get initials from nome
            const initials = professor.nome
                .split(' ')
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase();

            // Get primary discipline (first in array or 'N/A')
            const disciplinaNome = professor.disciplinas && professor.disciplinas.length > 0
                ? disciplinasMap[professor.disciplinas[0]] || 'N/A'
                : 'N/A';

            // Rotate through avatar colors
            const color = avatarColors[index % avatarColors.length];

            // Map unidade to department filter value
            const departmentValue = departmentMapping[professor.unidade] || '';

            // Generate card HTML
            const card = `
                <div class="docente-card bg-white dark:bg-[#ffffff] rounded-lg shadow p-6" data-nome="${professor.nome.toLowerCase()}" data-department="${departmentValue}">
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

    // Search functionality
    function setupSearch() {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const cards = document.querySelectorAll('.docente-card');
            cards.forEach(card => {
                const nome = card.dataset.nome;
                card.style.display = nome.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Filter functionality
    function setupFilter() {
        filterDepartment.addEventListener('change', function () {
            const selectedDepartment = this.value;
            const cards = document.querySelectorAll('.docente-card');
            cards.forEach(card => {
                const department = card.dataset.department;
                card.style.display = selectedDepartment === '' || department === selectedDepartment ? '' : 'none';
            });
        });
    }

    // Initialize
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadProfessores();
            setupSearch();
            setupFilter();
        } else {
            docentesList.innerHTML = '<p class="text-center text-gray-500">Por favor, inicie sessão.</p>';
        }
    });
});