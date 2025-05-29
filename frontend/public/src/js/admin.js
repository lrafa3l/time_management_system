document.addEventListener("DOMContentLoaded", function () {
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

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    const usersList = document.getElementById('users-list');
    const paginationNav = document.querySelector('.pagination-nav');
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');
    const addUserBtn = document.getElementById('add-user-btn');
    const modalTitle = document.getElementById('modal-title');
    const searchInput = document.getElementById('search-docentes');

    let currentPage = 1;
    const usersPerPage = 6;
    let allUsers = [];
    let filteredUsers = [];
    let isEditMode = false;
    let currentUserId = null;

    function showLoadingSpinner() {
        Swal.fire({
            title: 'Processando...',
            html: '<div class="swal-spinner"></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title' }
        });
    }

    // Cache users in sessionStorage
    function cacheUsers(users, adminId) {
        try {
            if (!adminId) throw new Error('No admin ID provided');
            sessionStorage.setItem(`adminUsers_${adminId}`, JSON.stringify(users));
            console.log(`Usuários cacheados para admin ${adminId}, ${users.length} usuários`);
        } catch (error) {
            console.warn('Erro ao salvar usuários no sessionStorage:', error);
            if (error.name === 'QuotaExceededError') {
                console.warn('Limite de sessionStorage excedido. Limpando dados antigos.');
                sessionStorage.removeItem(`adminUsers_${adminId}`);
                try {
                    sessionStorage.setItem(`adminUsers_${adminId}`, JSON.stringify(users));
                    console.log(`Cache salvo após limpeza para admin ${adminId}`);
                } catch (innerErr) {
                    console.warn('Falha ao salvar após limpeza:', innerErr);
                    Swal.fire({
                        title: 'Aviso',
                        text: 'Falha ao salvar cache local. Dados serão carregados do servidor.',
                        icon: 'warning',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                }
            }
        }
    }

    async function checkAdmin() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/login';
            return false;
        }
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (!doc.exists || doc.data().role !== 'admin') {
                Swal.fire({
                    title: 'Acesso Negado',
                    text: 'Apenas administradores podem acessar esta página.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                }).then(() => {
                    window.location.href = '/pagina-inicial';
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
            Swal.fire({
                title: 'Erro',
                text: 'Falha ao verificar permissões. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            return false;
        }
    }

    function generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async function sendPasswordEmail(email, password) {
        try {
            const response = await fetch('https://us-central1-schedule-system-8c4b6.cloudfunctions.net/sendPasswordEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: Falha ao enviar email`);
            console.log(`Email de senha enviado para ${email}`);
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            throw error;
        }
    }

    async function addUser(data, password) {
        showLoadingSpinner();
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(data.email, password);
            const user = userCredential.user;
            const userData = {
                email: data.email,
                name: data.nome,
                role: data.role
            };
            const professorData = {
                nome: data.nome,
                nomeNormalized: (data.nome || '').toLowerCase(),
                email: data.email,
                emailNormalized: (data.email || '').toLowerCase(),
                contacto: data.contacto,
                formacaoMedio: data.formacaoMedio,
                habilitacoes: data.habilitacoes,
                unidade: data.unidade,
                categoria: data.categoria,
                classes: data.classes,
                disciplinas: data.disciplinas,
                cargo: data.cargo,
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(user.uid).set(userData);
            await db.collection('professores').doc(user.uid).set(professorData);
            await sendPasswordEmail(data.email, password);
            Swal.fire({
                title: 'Sucesso!',
                text: 'Usuário adicionado e email enviado.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            hideModal();
            await loadUsers(); // Recarrega para atualizar allUsers
            cacheUsers(allUsers, auth.currentUser.uid); // Cache após atualização
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível adicionar o usuário. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        } finally {
            Swal.close();
        }
    }

    async function updateUser(data) {
        showLoadingSpinner();
        try {
            const userData = {
                email: data.email,
                name: data.nome,
                role: data.role
            };
            const professorData = {
                nome: data.nome,
                nomeNormalized: (data.nome || '').toLowerCase(),
                email: data.email,
                emailNormalized: (data.email || '').toLowerCase(),
                contacto: data.contacto,
                formacaoMedio: data.formacaoMedio,
                habilitacoes: data.habilitacoes,
                unidade: data.unidade,
                categoria: data.categoria,
                classes: data.classes,
                disciplinas: data.disciplinas,
                cargo: data.cargo
            };
            await db.collection('users').doc(currentUserId).set(userData, { merge: true });
            await db.collection('professores').doc(currentUserId).set(professorData, { merge: true });
            Swal.fire({
                title: 'Sucesso!',
                text: 'Usuário atualizado com sucesso.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            hideModal();
            await loadUsers(); // Recarrega para atualizar allUsers
            cacheUsers(allUsers, auth.currentUser.uid); // Cache após atualização
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível atualizar o usuário. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        } finally {
            Swal.close();
        }
    }

    async function deleteUser(userId) {
        showLoadingSpinner();
        try {
            await db.collection('users').doc(userId).delete();
            await db.collection('professores').doc(userId).delete();
            Swal.fire({
                title: 'Sucesso!',
                text: 'Usuário deletado com sucesso.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            await loadUsers(); // Recarrega para atualizar allUsers
            cacheUsers(allUsers, auth.currentUser.uid); // Cache após atualização
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível deletar o usuário. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        } finally {
            Swal.close();
        }
    }

    function showModal(user = null) {
        isEditMode = !!user;
        currentUserId = user ? user.id : null;
        modalTitle.textContent = isEditMode ? 'Editar Usuário' : 'Adicionar Usuário';
        userForm.reset();
        if (isEditMode) {
            userForm.nome.value = user.nome || '';
            userForm.email.value = user.email || '';
            userForm.contacto.value = user.contacto || '';
            userForm.formacaoMedio.value = user.formacaoMedio || '';
            userForm.habilitacoes.value = user.habilitacoes || '';
            userForm.unidade.value = user.unidade || '';
            userForm.categoria.value = user.categoria || '';
            userForm.classes.value = user.classes ? user.classes.join(', ') : '';
            userForm.disciplinas.value = user.disciplinas ? user.disciplinas.join(', ') : '';
            userForm.cargo.value = user.cargo || '';
            userForm.role.value = user.role || 'user';
        }
        userModal.classList.remove('hidden');
    }

    function hideModal() {
        userModal.classList.add('hidden');
        isEditMode = false;
        currentUserId = null;
    }

    function searchUsers(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            filteredUsers = [...allUsers];
        } else {
            filteredUsers = allUsers.filter(user =>
                (user.nome || '').toLowerCase().includes(query) ||
                (user.email || '').toLowerCase().includes(query)
            );
        }
        currentPage = 1;
        renderPage(currentPage);
        console.log(`Pesquisa realizada: "${query}", encontrados ${filteredUsers.length} usuários`);
    }

    async function loadUsers() {
        const adminId = auth.currentUser ? auth.currentUser.uid : null;
        if (!adminId) {
            console.warn('Nenhum adminId disponível. Abortando loadUsers.');
            return;
        }

        // Verificar cache primeiro
        try {
            const cachedUsers = sessionStorage.getItem(`adminUsers_${adminId}`);
            if (cachedUsers) {
                const parsedUsers = JSON.parse(cachedUsers);
                if (Array.isArray(parsedUsers)) {
                    allUsers = parsedUsers;
                    filteredUsers = [...allUsers];
                    console.log(`Usuários carregados do cache para admin ${adminId}, ${allUsers.length} usuários`);
                    renderPage(currentPage);
                    return;
                } else {
                    console.warn('Dados do cache inválidos. Removendo cache.');
                    sessionStorage.removeItem(`adminUsers_${adminId}`);
                }
            }
        } catch (error) {
            console.warn('Erro ao recuperar usuários do sessionStorage:', error);
            sessionStorage.removeItem(`adminUsers_${adminId}`); // Limpa cache corrompido
        }

        // Carregar do Firestore
        showLoadingSpinner();
        try {
            const professorSnapshot = await db.collection('professores').orderBy('nome').get();
            const userSnapshot = await db.collection('users').get();
            const userMap = new Map(userSnapshot.docs.map(doc => [doc.id, doc.data()]));
            allUsers = professorSnapshot.docs.map(doc => {
                const professorData = doc.data();
                const userData = userMap.get(doc.id) || {};
                return {
                    id: doc.id,
                    nome: professorData.nome || '',
                    email: userData.email || professorData.email || 'N/A',
                    role: userData.role || 'user',
                    contacto: professorData.contacto || '',
                    formacaoMedio: professorData.formacaoMedio || '',
                    habilitacoes: professorData.habilitacoes || '',
                    unidade: professorData.unidade || '',
                    categoria: professorData.categoria || '',
                    classes: professorData.classes || [],
                    disciplinas: professorData.disciplinas || [],
                    cargo: professorData.cargo || ''
                };
            });
            filteredUsers = [...allUsers];
            cacheUsers(allUsers, adminId); // Cachear após carregar
            renderPage(currentPage);
            console.log(`Usuários carregados do Firestore para admin ${adminId}, ${allUsers.length} usuários`);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            usersList.innerHTML = '<p class="text-center text-red-500">Erro ao carregar usuários.</p>';
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível carregar os usuários. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        } finally {
            Swal.close();
        }
    }

    function renderUsers(users, startIndex) {
        usersList.innerHTML = '';
        users.forEach(user => {
            const card = `
                <div class="user-card bg-white dark:bg-[#ffffff] rounded-lg shadow p-6">
                    <div class="flex items-center space-x-4 mb-4">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span class="text-blue-600 dark:text-blue-300 font-medium text-lg">
                                    ${user.nome ? user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-[#144b7b] truncate">${user.nome || 'N/A'}</h3>
                            <p class="text-sm text-gray-500 dark:text-[#29a8dc] truncate">${user.email || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <i class="fas fa-user-shield text-[#29a8dc] mr-2"></i>
                            <span class="text-sm text-gray-600 dark:text-[#29a8dc]">${user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                        </div>
                    </div>
                    <div class="mt-4 flex space-x-2">
                        <button class="edit-btn flex-1 bg-[#29a8dc] hover:bg-[#2195c3] text-white font-semibold py-2 px-4 rounded-lg text-sm">Editar</button>
                        <button class="delete-btn flex-1 bg-[#f36c6c] hover:bg-[#d32f2f] text-white font-semibold py-2 px-4 rounded-lg text-sm">Deletar</button>
                    </div>
                </div>
            `;
            usersList.insertAdjacentHTML('beforeend', card);
            const editBtn = usersList.querySelector(`.user-card:last-child .edit-btn`);
            const deleteBtn = usersList.querySelector(`.user-card:last-child .delete-btn`);
            editBtn.addEventListener('click', () => showModal(user));
            deleteBtn.addEventListener('click', () => {
                Swal.fire({
                    title: 'Tem certeza que deseja deletar este usuário?',
                    text: 'Esta ação não pode ser desfeita.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, deletar',
                    cancelButtonText: 'Não',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-cancel-button', cancelButton: 'my-swal-button' }
                }).then((result) => {
                    if (result.isConfirmed) {
                        deleteUser(user.id);
                    }
                });
            });
        });
    }

    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / usersPerPage);
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
            pageButton.className = `px-4 py-2 border border-gray-300 bg-white ${i === currentPage ? 'dark:bg-[#d7faff] text-[#29a8dc]' : 'dark:bg-[#ffffff] text-[#29a8dc] hover:bg-[#d7faff]'}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(i);
            });
            paginationNav.appendChild(pageButton);
        }
        const nextButton = document.createElement('a');
        nextButton.href = '#';
        nextButton.className = `px-3 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-[#ffffff] text-gray-500 dark:text-[#29a8dc] hover:bg-[#d7faff] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage < totalPages) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                changePage(currentPage + 1);
            });
        }
        paginationNav.appendChild(nextButton);
    }

    function changePage(page) {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        currentPage = Math.max(1, Math.min(page, totalPages));
        renderPage(currentPage);
    }

    function renderPage(page) {
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const pageUsers = filteredUsers.slice(startIndex, endIndex);
        renderUsers(pageUsers, startIndex);
        renderPagination(filteredUsers.length);
    }

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(userForm);
        const data = {
            nome: formData.get('nome') || '',
            email: formData.get('email') || '',
            contacto: formData.get('contacto') || '',
            formacaoMedio: formData.get('formacaoMedio') || '',
            habilitacoes: formData.get('habilitacoes') || '',
            unidade: formData.get('unidade') || '',
            categoria: formData.get('categoria') || '',
            classes: formData.get('classes') ? formData.get('classes').split(',').map(s => s.trim()) : [],
            disciplinas: formData.get('disciplinas') ? formData.get('disciplinas').split(',').map(s => s.trim()) : [],
            cargo: formData.get('cargo') || '',
            role: formData.get('role') || 'user'
        };
        if (isEditMode) {
            await updateUser(data);
        } else {
            const password = generatePassword();
            await addUser(data, password);
        }
    });

    addUserBtn.addEventListener('click', () => showModal());
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', hideModal);
    });

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value;
        searchUsers(query);
    }, 300));

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    auth.onAuthStateChanged(async (user) => {
        if (user && await checkAdmin()) {
            await loadUsers();
        }
    });
});