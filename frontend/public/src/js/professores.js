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
    const professorForm = document.getElementById('professor-form');
    const editButton = document.getElementById('edit-professor-btn');
    const deleteButton = document.getElementById('delete-professor-btn');

    // Check DOM elements
    if (!docentesList) console.error('Docentes list not found');
    if (!searchInput) console.error('Search input not found');
    if (!paginationNav) console.error('Pagination nav not found');
    if (!professorModal) console.error('Professor modal not found');
    if (!professorForm) console.error('Professor form not found');
    if (!editButton) console.error('Edit button not found');
    if (!deleteButton) console.error('Delete button not found');

    // Pagination state
    let currentPage = 1;
    const cardsPerPage = 6;
    let allProfessores = [];
    let filteredProfessores = [];
    let disciplinasMap = {};
    let isEditMode = false;
    let currentProfessorId = null;

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

    // Map discipline names to IDs
    function getDisciplinaIds(names) {
        if (!names) return [];
        const nameArray = names.split(',').map(s => s.trim());
        const ids = [];
        for (const name of nameArray) {
            const id = Object.keys(disciplinasMap).find(key => disciplinasMap[key].toLowerCase() === name.toLowerCase());
            if (id) ids.push(id);
        }
        return ids;
    }

    // Toggle edit mode
    function toggleEditMode(professor) {
        isEditMode = !isEditMode;
        const detailValues = document.querySelectorAll('.detail-value');
        const detailInputs = document.querySelectorAll('.detail-input');
        
        if (isEditMode) {
            // Switch to edit mode
            detailValues.forEach(span => span.classList.add('hidden'));
            detailInputs.forEach(input => input.classList.remove('hidden'));
            editButton.textContent = 'Salvar';
            editButton.classList.add('bg-green-500', 'hover:bg-green-600');
            editButton.classList.remove('bg-[#29a8dc]', 'hover:bg-[#2195c3]');
            // Populate inputs
            document.getElementById('edit-professor-fullname').value = professor.nome || '';
            document.getElementById('edit-professor-email').value = professor.email || '';
            document.getElementById('edit-professor-contacto').value = professor.contacto || '';
            document.getElementById('edit-professor-formacao-medio').value = professor.formacaoMedio || '';
            document.getElementById('edit-professor-habilitacoes-superior').value = professor.habilitacoes || '';
            document.getElementById('edit-professor-unidade-organica').value = professor.unidade || '';
            document.getElementById('edit-professor-categoria').value = professor.categoria || '';
            document.getElementById('edit-professor-classe-leciona').value = Array.isArray(professor.classes) ? professor.classes.join(', ') : '';
            document.getElementById('edit-professor-disciplinas').value = Array.isArray(professor.disciplinas) ? professor.disciplinas.map(id => disciplinasMap[id] || 'Desconhecida').join(', ') : '';
            document.getElementById('edit-professor-cargo-funcao').value = professor.cargo || '';
        } else {
            // Switch back to view mode
            detailValues.forEach(span => span.classList.remove('hidden'));
            detailInputs.forEach(input => input.classList.add('hidden'));
            editButton.textContent = 'Editar';
            editButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            editButton.classList.add('bg-[#29a8dc]', 'hover:bg-[#2195c3]');
        }
    }

    // Show loading spinner
    function showLoadingSpinner() {
        Swal.fire({
            title: 'Processando...',
            html: '<div class="swal-spinner"></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: {
                popup: 'my-swal-popup',
                title: 'my-swal-title'
            }
        });
    }

    // Save professor changes
    async function saveProfessorChanges() {
        showLoadingSpinner();
        const formData = new FormData(professorForm);
        const updatedData = {
            nome: formData.get('nome') || '',
            email: formData.get('email') || '',
            contacto: formData.get('contacto') || '',
            formacaoMedio: formData.get('formacaoMedio') || '',
            habilitacoes: formData.get('habilitacoes') || '',
            unidade: formData.get('unidade') || '',
            categoria: formData.get('categoria') || '',
            classes: formData.get('classes') ? formData.get('classes').split(',').map(s => s.trim()) : [],
            disciplinas: getDisciplinaIds(formData.get('disciplinas')),
            cargo: formData.get('cargo') || '',
            userId: firebase.auth().currentUser.uid
        };

        try {
            await db.collection('professores').doc(currentProfessorId).set(updatedData, { merge: true });
            Swal.fire({
                title: 'Sucesso!',
                text: 'Docente atualizado(a) com sucesso.',
                icon: 'success',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-confirm-button'
                }
            });
            hideProfessorModal();
            await loadProfessores();
        } catch (error) {
            console.error('Erro ao atualizar docente:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível atualizar o(a) docente. Tente novamente.',
                icon: 'error',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-confirm-button'
                }
            });
        }
    }

    // Delete professor
    async function deleteProfessor(professorId) {
        showLoadingSpinner();
        try {
            await db.collection('professores').doc(professorId).delete();
            Swal.fire({
                title: 'Sucesso!',
                text: 'Docente deletado(a) com sucesso.',
                icon: 'success',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-confirm-button'
                }
            });
            hideProfessorModal();
            await loadProfessores();
        } catch (error) {
            console.error('Erro ao deletar docente:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível deletar o(a) docente. Tente novamente.',
                icon: 'error',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-confirm-button'
                }
            });
        }
    }

    // Show professor details in modal
    function showProfessorModal(professor) {
        if (!professorModal) {
            console.error('Professor modal element not found');
            return;
        }

        console.log('Showing modal for:', professor.nome);
        currentProfessorId = professor.id;
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
            isEditMode = false;
            editButton.textContent = 'Editar';
            editButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            editButton.classList.add('bg-[#29a8dc]', 'hover:bg-[#2195c3]');
            document.querySelectorAll('.detail-value').forEach(span => span.classList.remove('hidden'));
            document.querySelectorAll('.detail-input').forEach(input => input.classList.add('hidden'));
            console.log('Modal shown');
        } catch (e) {
            console.error('Error populating modal:', e);
        }
    }

    // Hide modal
    function hideProfessorModal() {
        if (professorModal) {
            professorModal.classList.add('hidden');
            isEditMode = false;
            currentProfessorId = null;
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
                            <span class="text-sm text-gray-600 dark:text-[#144b7b] font-semibold">${professor.email || 'N/A'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-phone text-[#29a8dc] mr-2"></i>
                            <span class="text-sm text-gray-600 dark:text-[#144b7b] font-semibold">${professor.contacto || 'N/A'}</span>
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

    // Setup edit and delete buttons
    function setupModalActionButtons() {
        editButton.addEventListener('click', () => {
            if (isEditMode) {
                saveProfessorChanges();
            } else {
                const professor = allProfessores.find(p => p.id === currentProfessorId);
                if (professor) {
                    toggleEditMode(professor);
                }
            }
        });

        deleteButton.addEventListener('click', () => {
            Swal.fire({
                title: 'Tem certeza que deseja deletar?',
                text: 'Esta ação não pode ser desfeita.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, deletar',
                cancelButtonText: 'Não',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-cancel-button',
                    cancelButton: 'my-swal-button'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteProfessor(currentProfessorId);
                }
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
            setupModalActionButtons();
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