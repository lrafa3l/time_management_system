document.addEventListener("DOMContentLoaded", () => {
    const firebase = window.firebase; // Declare firebase variable
    const Swal = window.Swal; // Declare Swal variable

    const firebaseConfig = {
        apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
        authDomain: "schedule-system-8c4b6.firebaseapp.com",
        databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
        projectId: "schedule-system-8c4b6",
        storageBucket: "schedule-system-8c4b6.firebasestorage.app",
        messagingSenderId: "1056197912318",
        appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
        measurementId: "G-GHEY7QZEQ9",
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    let allUsers = [];
    let filteredUsers = [];
    let currentPage = 1;
    const usersPerPage = 8;

    // Elementos DOM
    const usersTable = document.getElementById("usersTable");
    const searchInput = document.getElementById("searchInput");
    const profileFilter = document.getElementById("profileFilter");
    const statusFilter = document.getElementById("statusFilter");
    const addUserBtn = document.getElementById("addUserBtn");
    const userModal = document.getElementById("userModal");
    const userForm = document.getElementById("userForm");
    const paginationContainer = document.getElementById("pagination");
    const totalUsers = document.getElementById("totalUsers");
    const activeUsers = document.getElementById("activeUsers");
    const totalProfessors = document.getElementById("totalProfessors");
    const totalAdmins = document.getElementById("totalAdmins");

    // Verificar se é admin
    async function checkAdminAccess() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = "/index.html";
            return false;
        }

        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== "admin") {
                Swal.fire({
                    title: "Acesso Negado",
                    text: "Apenas administradores podem acessar esta página.",
                    icon: "error",
                    confirmButtonText: "OK",
                    customClass: {
                        popup: "my-swal-popup",
                        title: "my-swal-title",
                        content: "my-swal-text",
                        confirmButton: "my-swal-button",
                    },
                }).then(() => {
                    window.location.href = "/main.html";
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error("Erro ao verificar permissões:", error);
            return false;
        }
    }

    // Carregar usuários
    async function loadUsers() {
        try {
            showLoading();
            const usersSnapshot = await db.collection("users").get();
            const professoresSnapshot = await db.collection("professores").get();

            const professoresMap = new Map();
            professoresSnapshot.docs.forEach((doc) => {
                professoresMap.set(doc.id, doc.data());
            });

            allUsers = usersSnapshot.docs.map((doc) => {
                const userData = doc.data();
                const professorData = professoresMap.get(doc.id) || {};

                return {
                    id: doc.id,
                    email: professorData.email || "",
                    name: professorData.nome || "",
                    role: userData.role || "professor",
                    contacto: professorData.contacto || "",
                    unidade: professorData.unidadeOrganica || professorData.unidade || "",
                    categoria: professorData.categoria || "",
                    createdAt: userData.createdAt || null,
                    lastLogin: userData.lastLogin || null,
                    active: userData.active !== false,
                };
            });

            // Update stats
            totalUsers.textContent = allUsers.length;
            activeUsers.textContent = allUsers.filter((u) => u.active).length;
            totalProfessors.textContent = allUsers.filter((u) => u.role === "professor").length;
            totalAdmins.textContent = allUsers.filter((u) => u.role === "admin").length;

            filteredUsers = [...allUsers];
            renderUsers();
            hideLoading();
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            Swal.fire({
                title: "Erro",
                text: "Erro ao carregar usuários. Tente novamente.",
                icon: "error",
                customClass: {
                    popup: "my-swal-popup",
                    title: "my-swal-title",
                    content: "my-swal-text",
                    confirmButton: "my-swal-button",
                },
            });
            hideLoading();
        }
    }

    // Renderizar usuários (table format)
    function renderUsers() {
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const pageUsers = filteredUsers.slice(startIndex, endIndex);

        usersTable.innerHTML = "";

        if (pageUsers.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="text-gray-400 text-6xl mb-4">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                        <p class="text-gray-500">Tente ajustar os filtros de pesquisa.</p>
                    </td>
                </tr>
            `;
            return;
        }

        pageUsers.forEach((user) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                ${user.name
                                    ? user.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)
                                    : "U"
                                }
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.name || "Nome não definido"}</div>
                            <div class="text-sm text-gray-500">${user.contacto || "-"}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${user.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        {
                            admin: "bg-red-100 text-red-800",
                            director: "bg-purple-100 text-purple-800",
                            subdirector: "bg-blue-100 text-blue-800",
                            coordenador: "bg-green-100 text-green-800",
                            professor: "bg-gray-100 text-gray-800",
                        }[user.role] || "bg-gray-100 text-gray-800"
                    }">
                        ${{
                            admin: "Administrador",
                            director: "Director",
                            subdirector: "Subdirector",
                            coordenador: "Coordenador",
                            professor: "Professor",
                        }[user.role] || "Professor"}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }">
                        ${user.active ? "Ativo" : "Inativo"}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleString("pt-BR") : "-"}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-900 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleUserStatus('${user.id}', ${user.active})" class="text-yellow-600 hover:text-yellow-900 mr-2">
                        <i class="fas fa-${user.active ? "pause" : "play"}"></i>
                    </button>
                    <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            usersTable.appendChild(row);
        });

        renderPagination();
    }

    // Renderizar paginação
    function renderPagination() {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        let paginationHTML = `
            <div class="flex items-center justify-between mt-4">
                <div class="text-sm text-gray-700">
                    Mostrando ${(currentPage - 1) * usersPerPage + 1} a ${Math.min(currentPage * usersPerPage, filteredUsers.length)} de ${filteredUsers.length} usuários
                </div>
                <div class="flex space-x-1">
        `;

        // Botão anterior
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""} 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
            </button>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `
                    <button class="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md">
                        ${i}
                    </button>
                `;
            } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button onclick="changePage(${i})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="px-3 py-2 text-sm font-medium text-gray-500">...</span>`;
            }
        }

        // Botão próximo
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""} 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Próximo
            </button>
        `;

        paginationHTML += `
                </div>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // Filtrar usuários
    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        const roleFilter = profileFilter.value;
        const statusFilter = statusFilter.value;

        filteredUsers = allUsers.filter((user) => {
            const matchesSearch =
                !searchTerm || user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || (statusFilter === "ativo" ? user.active : !user.active);

            return matchesSearch && matchesRole && matchesStatus;
        });

        currentPage = 1;
        renderUsers();
    }

    // Funções globais
    window.changePage = (page) => {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderUsers();
        }
    };

    window.editUser = (userId) => {
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
            // Preencher formulário e abrir modal
            document.getElementById("userId").value = user.id;
            document.getElementById("userName").value = user.name;
            document.getElementById("userEmail").value = user.email;
            document.getElementById("userProfile").value = user.role;
            document.getElementById("userStatus").value = user.active ? "ativo" : "inativo";
            document.getElementById("modalTitle").textContent = "Editar Usuário";
            document.getElementById("passwordField").classList.add("hidden"); // Hide password field for edits
            userModal.classList.remove("hidden");
        }
    };

    window.toggleUserStatus = (userId, currentStatus) => {
        Swal.fire({
            title: currentStatus ? "Desativar Usuário" : "Ativar Usuário",
            text: `Tem certeza que deseja ${currentStatus ? "desativar" : "ativar"} este usuário?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sim",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "my-swal-popup",
                title: "my-swal-title",
                content: "my-swal-text",
                confirmButton: "my-swal-button",
                cancelButton: "my-swal-button",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await db.collection("users").doc(userId).update({
                        active: !currentStatus,
                    });

                    Swal.fire({
                        title: "Sucesso!",
                        text: `Usuário ${currentStatus ? "desativado" : "ativado"} com sucesso.`,
                        icon: "success",
                        customClass: {
                            popup: "my-swal-popup",
                            title: "my-swal-title",
                            content: "my-swal-text",
                            confirmButton: "my-swal-button",
                        },
                    });

                    loadUsers();
                } catch (error) {
                    console.error("Erro ao alterar status:", error);
                    Swal.fire({
                        title: "Erro",
                        text: "Erro ao alterar status do usuário.",
                        icon: "error",
                        customClass: {
                            popup: "my-swal-popup",
                            title: "my-swal-title",
                            content: "my-swal-text",
                            confirmButton: "my-swal-button",
                        },
                    });
                }
            }
        });
    };

    window.deleteUser = (userId) => {
        Swal.fire({
            title: "Deletar Usuário",
            text: "Esta ação não pode ser desfeita. Tem certeza?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, deletar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#dc2626",
            customClass: {
                popup: "my-swal-popup",
                title: "my-swal-title",
                content: "my-swal-text",
                confirmButton: "my-swal-button",
                cancelButton: "my-swal-button",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await db.collection("users").doc(userId).delete();
                    await db.collection("professores").doc(userId).delete();

                    Swal.fire({
                        title: "Sucesso!",
                        text: "Usuário deletado com sucesso.",
                        icon: "success",
                        customClass: {
                            popup: "my-swal-popup",
                            title: "my-swal-title",
                            content: "my-swal-text",
                            confirmButton: "my-swal-button",
                        },
                    });

                    loadUsers();
                } catch (error) {
                    console.error("Erro ao deletar usuário:", error);
                    Swal.fire({
                        title: "Erro",
                        text: "Erro ao deletar usuário.",
                        icon: "error",
                        customClass: {
                            popup: "my-swal-popup",
                            title: "my-swal-title",
                            content: "my-swal-text",
                            confirmButton: "my-swal-button",
                        },
                    });
                }
            }
        });
    }

    // Funções utilitárias
    function showLoading() {
        usersTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </td>
            </tr>
        `;
    }

    function hideLoading() {
        // Loading será removido quando renderUsers() for chamado
    }

    // Event listeners
    searchInput.addEventListener("input", debounce(filterUsers, 300));
    profileFilter.addEventListener("change", filterUsers);
    statusFilter.addEventListener("change", filterUsers);

    addUserBtn.addEventListener("click", () => {
        userForm.reset();
        document.getElementById("userId").value = "";
        document.getElementById("modalTitle").textContent = "Novo Usuário";
        document.getElementById("passwordField").classList.remove("hidden"); // Show password field for new users
        userModal.classList.remove("hidden");
    });

    // Fechar modal
    document.getElementById("cancelUser").addEventListener("click", () => {
        userModal.classList.add("hidden");
    });

    // Submeter formulário
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(userForm);
        const userId = formData.get("userId");
        const userData = {
            nome: formData.get("userName"),
            email: formData.get("userEmail"),
            role: formData.get("userProfile"),
            active: formData.get("userStatus") === "ativo",
            contacto: "",
            formacaoMedio: "",
            habilitacoes: "",
            unidade: "",
            categoria: "",
            classes: [],
            disciplinas: [],
            cargo: "",
        };

        try {
            if (userId) {
                // Editar usuário existente
                await db.collection("users").doc(userId).update({
                    role: userData.role,
                    active: userData.active,
                });
                await db.collection("professores").doc(userId).update({
                    nome: userData.nome,
                    email: userData.email,
                });
                Swal.fire({
                    title: "Sucesso!",
                    text: "Usuário atualizado com sucesso.",
                    icon: "success",
                    customClass: {
                        popup: "my-swal-popup",
                        title: "my-swal-title",
                        content: "my-swal-text",
                        confirmButton: "my-swal-button",
                    },
                });
            } else {
                // Criar novo usuário
                const password = generatePassword();
                const userCredential = await auth.createUserWithEmailAndPassword(userData.email, password);

                await db.collection("users").doc(userCredential.user.uid).set({
                    role: userData.role,
                    active: userData.active,
                });
                await db.collection("professores").doc(userCredential.user.uid).set({
                    nome: userData.nome || "",
                    email: userData.email || "",
                    contacto: userData.contacto || "",
                    formacaoMedio: userData.formacaoMedio || "",
                    habilitacoes: userData.habilitacoes || "",
                    unidade: userData.unidade || "",
                    categoria: userData.categoria || "",
                    classes: Array.isArray(userData.classes) ? userData.classes : (userData.classes ? userData.classes.split(", ") : []),
                    disciplinas: Array.isArray(userData.disciplinas) ? userData.disciplinas : (userData.disciplinas ? userData.disciplinas.split(", ") : []),
                    cargo: userData.cargo || "",
                });

                // Enviar email com senha (implementar função)
                Swal.fire({
                    title: "Sucesso!",
                    text: `Usuário criado com sucesso. Senha: ${password}`,
                    icon: "success",
                    customClass: {
                        popup: "my-swal-popup",
                        title: "my-swal-title",
                        content: "my-swal-text",
                        confirmButton: "my-swal-button",
                    },
                });
            }

            userModal.classList.add("hidden");
            loadUsers();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            Swal.fire({
                title: "Erro",
                text: "Erro ao salvar usuário.",
                icon: "error",
                customClass: {
                    popup: "my-swal-popup",
                    title: "my-swal-title",
                    content: "my-swal-text",
                    confirmButton: "my-swal-button",
                },
            });
        }
    });

    // Função debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Gerar senha aleatória
    function generatePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let password = "";
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // Inicializar
    auth.onAuthStateChanged(async (user) => {
        if (user && (await checkAdminAccess())) {
            loadUsers();
        }
    });
});