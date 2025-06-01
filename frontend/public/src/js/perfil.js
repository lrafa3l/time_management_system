document.addEventListener("DOMContentLoaded", function () {
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

    const profileForm = document.getElementById("profile-form");
    const editButton = document.getElementById("edit-profile-btn");
    const cancelButton = document.getElementById("cancel-profile-btn");
    let isEditMode = false;
    let currentUser = null;

    function showLoadingSpinner() {
        Swal.fire({
            title: "Processando...",
            html: '<div class="swal-spinner"></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: { popup: "my-swal-popup", title: "my-swal-title" },
        });
    }

    function cacheProfileData(user, userData) {
        try {
            const profileData = {
                nome: userData.nome || "",
                email: user.email || "",
                contacto: userData.contacto || "",
                formacaoMedio: userData.formacaoMedio || "",
                habilitacoes: userData.habilitacoes || "",
                unidade: userData.unidade || "",
                categoria: userData.categoria || "",
                classes: Array.isArray(userData.classes) ? userData.classes : (userData.classes ? userData.classes.split(", ") : []),
                disciplinas: Array.isArray(userData.disciplinas) ? userData.disciplinas : (userData.disciplinas ? userData.disciplinas.split(", ") : []),
                cargo: userData.cargo || "",
            };
            sessionStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
            console.log(`Perfil do usuário ${user.uid} cacheado com sucesso`);
        } catch (error) {
            console.warn("Erro ao salvar perfil no sessionStorage:", error);
            if (error.name === "QuotaExceededError") {
                console.warn("Limite de sessionStorage excedido. Limpando dados antigos.");
                sessionStorage.removeItem(`userProfile_${user.uid}`);
                try {
                    sessionStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
                } catch (innerErr) {
                    console.warn("Falha ao salvar após limpeza:", innerErr);
                }
            }
        }
    }

    function renderSidebar(role) {
        const navMenu = document.getElementById("nav-menu");
        const cacheKey = `sidebar_${role}`;

        // Check if cached sidebar exists
        const cachedSidebar = sessionStorage.getItem(cacheKey);
        if (cachedSidebar) {
            navMenu.innerHTML = cachedSidebar;
            return;
        }

        // Render sidebar if no cache
        navMenu.innerHTML = ""; // Clear any existing links

        const sidebarLinks = {
            admin: [
                { href: "/admin", icon: "fas fa-user-shield", text: "Administração de Usuários" },
                { href: "/permissoes", icon: "fas fa-shield-alt", text: "Permissões" },
                { href: "/backup", icon: "fas fa-database", text: "Backup" },
                { href: "/conta", icon: "fa-solid fa-circle-user", text: "Conta", active: true },
                { href: "/definicoes", icon: "fas fa-sliders-h", text: "Definições" },
            ],
            director: [
                { href: "/director", icon: "fas fa-home", text: "Dashboard" },
                { href: "/relatorios", icon: "fas fa-chart-bar", text: "Relatórios" },
                { href: "/aprovacoes", icon: "fas fa-check-circle", text: "Aprovações" },
                { href: "/conta", icon: "fa-solid fa-circle-user", text: "Conta", active: true },
                { href: "/definicoes", icon: "fas fa-sliders-h", text: "Definições" },
            ],
            subdirector: [
                { href: "/subdirector", icon: "fas fa-home", text: "Página Inicial" },
                { href: "/subdirector/disciplinas", icon: "fas fa-book", text: "Minhas Disciplinas" },
                { href: "/subdirector/horarios", icon: "fas fa-calendar", text: "Horários" },
                { href: "/conta", icon: "fa-solid fa-circle-user", text: "Conta", active: true },
                { href: "/definicoes", icon: "fas fa-sliders-h", text: "Definições" },
            ],
            coordenador: [
                { href: "/coordenador", icon: "fas fa-home", text: "Dashboard" },
                { href: "/coordenador/solicitacoes", icon: "fas fa-file-alt", text: "Solicitações" },
                { href: "/coordenador/horarios", icon: "fas fa-calendar", text: "Horários" },
                { href: "/conta", icon: "fa-solid fa-circle-user", text: "Conta", active: true },
                { href: "/definicoes", icon: "fas fa-sliders-h", text: "Definições" },
            ],
            professor: [
                { href: "/professor", icon: "fas fa-home", text: "Meu horário" },
                { href: "/conta", icon: "fa-solid fa-circle-user", text: "Conta", active: true },
                { href: "/definicoes", icon: "fas fa-sliders-h", text: "Definições" },
            ],
        };

        const links = sidebarLinks[role] || [];
        links.forEach((link) => {
            const navItem = document.createElement("a");
            navItem.href = link.href;
            navItem.className = `nav-item ${link.active ? "active" : ""}`;
            navItem.innerHTML = `
                <i class="${link.icon}"></i>
                <span>${link.text}</span>
            `;
            navMenu.appendChild(navItem);
        });

        // Cache the rendered HTML
        sessionStorage.setItem(cacheKey, navMenu.innerHTML);
    }

    async function loadUserData() {
        if (!currentUser) {
            window.location.href = "/login";
            return;
        }

        // Check cache first
        try {
            const cachedProfile = sessionStorage.getItem(`userProfile_${currentUser.uid}`);
            if (cachedProfile) {
                const userData = JSON.parse(cachedProfile);
                console.log(`Carregando dados do perfil do cache para ${currentUser.uid}`);
                document.getElementById("account-name").textContent = userData.nome || "Não informado";
                document.getElementById("account-email").textContent = userData.email || "Não informado";
                document.getElementById("account-phone").textContent = userData.contacto || "Não informado";
                document.getElementById("account-formacao-medio").textContent = userData.formacaoMedio || "Não informado";
                document.getElementById("account-habilitacoes-superior").textContent = userData.habilitacoes || "Não informado";
                document.getElementById("account-unidade-organica").textContent = userData.unidade || "Não informado";
                document.getElementById("account-categoria").textContent = userData.categoria || "Não informado";
                document.getElementById("account-classe-leciona").textContent = Array.isArray(userData.classes) && userData.classes.length ? userData.classes.join(", ") : (userData.classes || "Não informado");
                document.getElementById("account-disciplinas").textContent = Array.isArray(userData.disciplinas) && userData.disciplinas.length ? userData.disciplinas.join(", ") : (userData.disciplinas || "Não informado");
                document.getElementById("account-cargo-funcao").textContent = userData.cargo || "Não informado";

                if (isEditMode) {
                    document.getElementById("edit-name").value = userData.nome || "";
                    document.getElementById("edit-email").value = userData.email || "";
                    document.getElementById("edit-phone").value = userData.contacto || "";
                    document.getElementById("edit-formacao-medio").value = userData.formacaoMedio || "";
                    document.getElementById("edit-habilitacoes-superior").value = userData.habilitacoes || "";
                    document.getElementById("edit-unidade-organica").value = userData.unidade || "";
                    document.getElementById("edit-categoria").value = userData.categoria || "";
                    document.getElementById("edit-classe-leciona").value = Array.isArray(userData.classes) ? userData.classes.join(", ") : (userData.classes || "");
                    document.getElementById("edit-disciplinas").value = Array.isArray(userData.disciplinas) ? userData.disciplinas.join(", ") : (userData.disciplinas || "");
                    document.getElementById("edit-cargo-funcao").value = userData.cargo || "";
                }
                return;
            }
        } catch (error) {
            console.warn("Erro ao recuperar perfil do sessionStorage:", error);
        }

        // Load from Firestore
        try {
            // Fetch role from users collection
            const userDoc = await db.collection("users").doc(currentUser.uid).get();
            if (!userDoc.exists) {
                console.log("Documento não encontrado em users");
                Swal.fire({
                    title: "Erro!",
                    text: "Dados do usuário não encontrados na coleção users.",
                    icon: "error",
                    customClass: { popup: "my-swal-popup", title: "my-swal-title", content: "my-swal-text", confirmButton: "my-swal-button" },
                });
                return;
            }
            const role = userDoc.data().role;

            // Fetch profile data from professores collection
            const profDoc = await db.collection("professores").doc(currentUser.uid).get();
            if (!profDoc.exists) {
                console.log("Documento não encontrado em professores");
                Swal.fire({
                    title: "Erro!",
                    text: "Dados do perfil não encontrados na coleção professores.",
                    icon: "error",
                    customClass: { popup: "my-swal-popup", title: "my-swal-title", content: "my-swal-text", confirmButton: "my-swal-button" },
                });
                return;
            }
            const userData = profDoc.data();

            document.getElementById("account-name").textContent = userData.nome || "Não informado";
            document.getElementById("account-email").textContent = currentUser.email || "Não informado";
            document.getElementById("account-phone").textContent = userData.contacto || "Não informado";
            document.getElementById("account-formacao-medio").textContent = userData.formacaoMedio || "Não informado";
            document.getElementById("account-habilitacoes-superior").textContent = userData.habilitacoes || "Não informado";
            document.getElementById("account-unidade-organica").textContent = userData.unidade || "Não informado";
            document.getElementById("account-categoria").textContent = userData.categoria || "Não informado";
            document.getElementById("account-classe-leciona").textContent = Array.isArray(userData.classes) && userData.classes.length ? userData.classes.join(", ") : (userData.classes || "Não informado");
            document.getElementById("account-disciplinas").textContent = Array.isArray(userData.disciplinas) && userData.disciplinas.length ? userData.disciplinas.join(", ") : (userData.disciplinas || "Não informado");
            document.getElementById("account-cargo-funcao").textContent = userData.cargo || "Não informado";

            if (isEditMode) {
                document.getElementById("edit-name").value = userData.nome || "";
                document.getElementById("edit-email").value = currentUser.email || "";
                document.getElementById("edit-phone").value = userData.contacto || "";
                document.getElementById("edit-formacao-medio").value = userData.formacaoMedio || "";
                document.getElementById("edit-habilitacoes-superior").value = userData.habilitacoes || "";
                document.getElementById("edit-unidade-organica").value = userData.unidade || "";
                document.getElementById("edit-categoria").value = userData.categoria || "";
                document.getElementById("edit-classe-leciona").value = Array.isArray(userData.classes) ? userData.classes.join(", ") : (userData.classes || "");
                document.getElementById("edit-disciplinas").value = Array.isArray(userData.disciplinas) ? userData.disciplinas.join(", ") : (userData.disciplinas || "");
                document.getElementById("edit-cargo-funcao").value = userData.cargo || "";
            }

            // Cache the loaded data
            cacheProfileData(currentUser, userData);

            // Render sidebar based on role from users collection
            renderSidebar(role);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            Swal.fire({
                title: "Erro!",
                text: "Não foi possível carregar os dados. Tente novamente.",
                icon: "error",
                customClass: { popup: "my-swal-popup", title: "my-swal-title", content: "my-swal-text", confirmButton: "my-swal-button" },
            });
        }
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        const detailValues = document.querySelectorAll(".detail-value");
        const detailInputs = document.querySelectorAll(".detail-input");
        if (isEditMode) {
            detailValues.forEach((span) => span.classList.add("hidden"));
            detailInputs.forEach((input) => input.classList.remove("hidden"));
            editButton.textContent = "Salvar";
            editButton.classList.add("bg-green-500", "hover:bg-green-600");
            editButton.classList.remove("bg-[#29a8dc]", "hover:bg-[#2195c3]");
            cancelButton.classList.remove("hidden");
            loadUserData(); // Populate inputs
        } else {
            detailValues.forEach((span) => span.classList.remove("hidden"));
            detailInputs.forEach((input) => input.classList.add("hidden"));
            editButton.textContent = "Editar Perfil";
            editButton.classList.remove("bg-green-500", "hover:bg-green-600");
            editButton.classList.add("bg-[#29a8dc]", "hover:bg-[#2195c3]");
            cancelButton.classList.add("hidden");
        }
    }

    async function saveProfileChanges() {
        showLoadingSpinner();
        if (!currentUser) {
            Swal.close();
            window.location.href = "/login";
            return;
        }

        const formData = new FormData(profileForm);
        const updatedData = {
            nome: formData.get("nome") || "",
            nomeNormalized: (formData.get("nome") || "").toLowerCase(),
            email: currentUser.email,
            emailNormalized: (currentUser.email || "").toLowerCase(),
            contacto: formData.get("contacto") || "",
            formacaoMedio: formData.get("formacaoMedio") || "",
            habilitacoes: formData.get("habilitacoes") || "",
            unidade: formData.get("unidade") || "",
            categoria: formData.get("categoria") || "",
            classes: formData.get("classes") ? formData.get("classes").split(",").map(s => s.trim()).filter(s => s) : [],
            disciplinas: formData.get("disciplinas") ? formData.get("disciplinas").split(",").map(s => s.trim()).filter(s => s) : [],
            cargo: formData.get("cargo") || "",
            userId: currentUser.uid,
        };

        try {
            await db.collection("professores").doc(currentUser.uid).set(updatedData, { merge: true });
            cacheProfileData(currentUser, updatedData);
            Swal.fire({
                title: "Sucesso!",
                text: "Perfil atualizado com sucesso.",
                icon: "success",
                customClass: { popup: "my-swal-popup", title: "my-swal-title", content: "my-swal-text", confirmButton: "my-swal-button" },
            });
            toggleEditMode();
            loadUserData();
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            Swal.fire({
                title: "Erro!",
                text: "Não foi possível atualizar o perfil. Tente novamente.",
                icon: "error",
                customClass: { popup: "my-swal-popup", title: "my-swal-title", content: "my-swal-text", confirmButton: "my-swal-button" },
            });
        }
    }

    editButton.addEventListener("click", () => {
        if (isEditMode) {
            saveProfileChanges();
        } else {
            toggleEditMode();
        }
    });

    cancelButton.addEventListener("click", () => {
        toggleEditMode();
        loadUserData(); // Reload original data to reset any changes
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
        } else {
            window.location.href = "/login";
        }
    });
});