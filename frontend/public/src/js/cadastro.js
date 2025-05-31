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
        try {
            firebase.initializeApp(firebaseConfig);
        } catch (error) {
            console.error("Erro na inicialização do Firebase:", error);
            return;
        }
    }
    const db = firebase.firestore();
    const UI = {
        modal: document.getElementById("index"),
        modalBody: document.querySelector(".modal-body"),
        modalTitle: document.getElementById("modalTitle"),
        closeBtn: document.querySelector(".close-modal"),
        triggers: document.querySelectorAll(".modal-trigger")
    };
    if (!UI.modal || !UI.modalBody || !UI.modalTitle || !UI.closeBtn) {
        console.error("Elementos essenciais da modal não encontrados!");
    } else {
        initializeModal();
    }

    let tempItems = [];

    function initializeModal() {
        UI.closeBtn.addEventListener("click", closeModal);
        UI.triggers.forEach(trigger => {
            trigger.addEventListener("click", function (e) {
                e.preventDefault();
                const formType = this.getAttribute("data-form");
                if (formType) {
                    tempItems = [];
                    // Save form type to sessionStorage
                    try {
                        sessionStorage.setItem('activeFormType', formType);
                    } catch (error) {
                        console.warn("Erro ao salvar formType no sessionStorage:", error);
                    }
                    loadForm(formType).catch(error => {
                        console.error("Erro ao carregar formulário:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Erro',
                            text: 'Erro ao carregar formulário. Tente novamente.',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#29a8dc',
                            customClass: {
                                popup: 'my-swal-popup',
                                title: 'my-swal-title',
                                content: 'my-swal-text',
                                confirmButton: 'my-swal-button'
                            },
                            backdrop: 'rgba(0, 0, 0, 0.5)'
                        });
                    });
                    openModal();
                }
            });
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && UI.modal.style.display === "flex") {
                closeModal();
            }
        });

        // Clear activeFormType on page load to prevent auto-opening
        try {
            sessionStorage.removeItem('activeFormType');
        } catch (error) {
            console.warn("Erro ao limpar activeFormType do sessionStorage:", error);
        }

        // Handle logout to clear sessionStorage
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                try {
                    sessionStorage.clear();
                    firebase.auth().signOut();
                } catch (error) {
                    console.warn("Erro ao limpar sessionStorage ou fazer logout:", error);
                }
            });
        }
    }

    function openModal() {
        document.body.classList.add("modal-open");
        UI.modal.style.display = "flex";
        UI.modal.querySelector("input")?.focus();
    }

    function closeModal() {
        document.body.classList.remove("modal-open");
        UI.modal.style.display = "none";
        UI.modalBody.innerHTML = '';
        tempItems = [];
        // Clear form data from sessionStorage on close (optional, can keep for restore)
        // sessionStorage.removeItem('formData');
    }

    async function loadForm(formType) {
        try {
            UI.modalTitle.textContent = getModalTitle(formType);
            const formHTML = await generateFormHTML(formType);
            UI.modalBody.innerHTML = formHTML;
            setupFormSubmitHandler(formType);
            setupFormInputListeners(formType); // Add input listeners for sessionStorage
        } catch (error) {
            console.error(`Erro ao carregar formulário ${formType}:`, error);
            throw error;
        }
    }

    function setupFormInputListeners(formType) {
        const form = document.getElementById(`cadastro-${formType}`);
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    saveFormData(formType, form);
                });
            });
        }
    }

    function saveFormData(formType, form) {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key === 'disciplinas' || key === 'classes') {
                data[key] = data[key] ? [...data[key], value] : [value];
            } else {
                data[key] = value;
            }
        });
        try {
            sessionStorage.setItem(`formData_${formType}`, JSON.stringify(data));
        } catch (error) {
            console.warn(`Erro ao salvar dados do formulário ${formType} no sessionStorage:`, error);
        }
    }

    function restoreFormData(formType) {
        try {
            const savedData = sessionStorage.getItem(`formData_${formType}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                const form = document.getElementById(`cadastro-${formType}`);
                if (form) {
                    Object.entries(data).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            // Handle checkboxes (e.g., disciplinas, classes)
                            value.forEach(val => {
                                const input = form.querySelector(`input[name="${key}"][value="${val}"]`);
                                if (input) input.checked = true;
                            });
                        } else {
                            const input = form.querySelector(`[name="${key}"]`);
                            if (input) input.value = value;
                        }
                    });
                }
            }
        } catch (error) {
            console.warn(`Erro ao restaurar dados do formulário ${formType}:`, error);
        }
    }

    function getModalTitle(formType) {
        const titles = {
            curso: 'Cadastro de Curso',
            sala: 'Cadastro de Sala',
            turma: 'Cadastro de Turma',
            professor: 'Cadastro de Docente',
            disciplina: 'Cadastro de Disciplina',
            horario: 'Gerar Horário'
        };
        return titles[formType] || `Cadastro de ${capitalizeFirstLetter(formType)}`;
    }

    function normalizeString(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    async function generateFormHTML(formType) {
        const forms = {
            curso: async () => {
                try {
                    const disciplinas = await loadDisciplinas();
                    const disciplinaCheckboxes = disciplinas.map(disciplina => `
                        <label class="checkbox-label">
                            <input type="checkbox" name="disciplinas" value="${disciplina.id}">
                            <span>${disciplina.nome}</span>
                        </label>
                    `).join('');
                    return `
                        <form id="cadastro-curso">
                            <div class="form-group">
                                <label for="nome">Curso</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label>Disciplinas</label>
                                <div class="checkbox-group">
                                    ${disciplinaCheckboxes || '<p>Nenhuma disciplina disponível</p>'}
                                </div>
                            </div>
                            <button type="submit" id="submit-btn">Cadastrar <span class="spinner"></span></button>
                        </form>`;
                } catch (error) {
                    console.error("Erro ao carregar disciplinas:", error);
                    return `
                        <form id="cadastro-curso">
                            <div class="form-group">
                                <label for="nome">Curso</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label>Erro ao carregar disciplinas</label>
                            </div>
                            <button type="button" disabled>Não foi possível carregar</button>
                        </form>`;
                }
            },
            sala: `
                <form id="cadastro-sala">
                    <div class="added-items" id="added-salas"></div>
                    <div class="form-group">
                        <label for="nome">Sala</label>
                        <input type="text" id="nome" name="nome">
                    </div>
                    <div class="form-group">
                        <label for="capacidade">Capacidade</label>
                        <input type="number" id="capacidade" min="1" name="capacidade">
                    </div>
                    <div class="button-group">
                        <button type="button" id="add-btn">Adicionar</button>
                        <button type="submit" id="save-btn">Salvar <span class="spinner"></span></button>
                    </div>
                </form>`,
            turma: async () => {
                try {
                    const cursos = await loadCursos();
                    const cursoOptions = cursos.map(curso =>
                        `<option value="${curso.id}">${curso.nome}</option>`
                    ).join('');
                    return `
                        <form id="cadastro-turma">
                            <div class="form-group">
                                <label for="nome">Turma</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label for="curso">Curso</label>
                                <select id="curso" name="curso" required>
                                    <option value="">Selecione um curso</option>
                                    ${cursoOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="classe">Classe</label>
                                <select id="classe" name="classe" required>
                                    <option value="">Selecione a classe</option>
                                    <option value="10ª">10ª</option>
                                    <option value="11ª">11ª</option>
                                    <option value="12ª">12ª</option>
                                    <option value="13ª">13ª</option>
                                </select>
                            </div>
                            <button type="submit" id="submit-btn">Cadastrar <span class="spinner"></span></button>
                        </form>`;
                } catch (error) {
                    console.error("Erro ao carregar cursos:", error);
                    return `
                        <form id="cadastro-turma">
                            <div class="form-group">
                                <label for="nome">Turma</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label>Erro ao carregar cursos</label>
                            </div>
                            <button type="button" disabled>Não foi possível carregar</button>
                        </form>`;
                }
            },
            professor: async () => {
                try {
                    const disciplinas = await loadDisciplinas();
                    const disciplinaCheckboxes = disciplinas.map(disciplina => `
                        <label class="checkbox-label">
                            <input type="checkbox" name="disciplinas" value="${disciplina.id}">
                            <span>${disciplina.nome}</span>
                        </label>
                    `).join('');
                    const classOptions = ['10', '11', '12', '13'].map(classe => `
                        <label class="checkbox-label">
                            <input type="checkbox" name="classes" value="${classe}">
                            <span>${classe}ª</span>
                        </label>
                    `).join('');
                    return `
                        <form id="cadastro-professor">
                            <div class="form-group">
                                <label for="nome">Nome Completo</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label for="unidade">Unidade Orgânica</label>
                                <input type="text" id="unidade" name="unidade" required>
                            </div>
                            <div class="form-group">
                                <label for="categoria">Categoria</label>
                                <select id="categoria" name="categoria" required>
                                    <option value="">Selecione...</option>
                                    <option value="professor1">Prof. Do Ens. Prim. E Sec. Do 1.º Grau</option>
                                    <option value="professor2">Prof. Do Ens. Prim. E Sec. Do 2.º Grau</option>
                                    <option value="professor3">Prof. Do Ens. Prim. E Sec. Do 3.º Grau</option>
                                    <option value="professor4">Prof. Do Ens. Prim. E Sec. Do 4.º Grau</option>
                                    <option value="professor5">Prof. Do Ens. Prim. E Sec. Do 5.º Grau</option>
                                    <option value="professor6">Prof. Do Ens. Prim. E Sec. Do 6.º Grau</option>
                                    <option value="professor7">Prof. Do Ens. Prim. E Sec. Do 7.º Grau</option>
                                    <option value="professor8">Prof. Do Ens. Prim. E Sec. Do 8.º Grau</option>
                                    <option value="professor9">Prof. Do Ens. Prim. E Sec. Do 9.º Grau</option>
                                    <option value="professor10">Prof. Do Ens. Prim. E Sec. Do 10.º Grau</option>
                                    <option value="professor11">Prof. Do Ens. Prim. E Sec. Do 11.º Grau</option>
                                    <option value="professor12">Prof. Do Ens. Prim. E Sec. Do 12.º Grau</option>
                                    <option value="professor13">Prof. Do Ens. Prim. E Sec. Do 13.º Grau</option>
                                    <option value="outra">Outra</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Classe(s) que Leciona</label>
                                <div class="checkbox-group">
                                    ${classOptions}
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Disciplina(s)</label>
                                <div class="checkbox-group">
                                    ${disciplinaCheckboxes || '<p>Nenhuma disciplina disponível</p>'}
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="formacaoMedio">Formação do Ensino Médio</label>
                                <input type="text" id="formacaoMedio" name="formacaoMedio" required>
                            </div>
                            <div class="form-group">
                                <label for="habilitacoes">Habilitações Literár. Ensino Superior</label>
                                <input type="text" id="habilitacoes" name="habilitacoes" required>
                            </div>
                            <div class="form-group">
                                <label for="cargo">Cargo / Função</label>
                                <input type="text" id="cargo" name="cargo" required>
                            </div>
                            <div class="form-group">
                                <label for="contacto">Contacto Telefónico</label>
                                <input type="tel" id="contacto" name="contacto" required>
                            </div>
                            <div class="form-group">
                                <label for="email">E-mail</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <button type="submit" id="submit-btn">Cadastrar <span class="spinner"></span></button>
                        </form>`;
                } catch (error) {
                    console.error("Erro ao carregar disciplinas:", error);
                    return `
                        <form id="cadastro-professor">
                            <div class="form-group">
                                <label for="nome">Nome Completo</label>
                                <input type="text" id="nome" name="nome" required>
                            </div>
                            <div class="form-group">
                                <label>Erro ao carregar disciplinas</label>
                            </div>
                            <button type="button" disabled>Não foi possível carregar</button>
                        </form>`;
                }
            },
            disciplina: `
                <form id="cadastro-disciplina">
                    <div class="added-items" id="added-disciplinas"></div>
                    <div class="form-group">
                        <label for="nome">Disciplina</label>
                        <input type="text" id="nome" name="nome">
                    </div>
                    <div class="button-group">
                        <button type="button" id="add-btn">Adicionar</button>
                        <button type="submit" id="save-btn">Salvar <span class="spinner"></span></button>
                    </div>
                </form>`,
            horario: async () => {
                try {
                    const professores = await loadProfessores();
                    const options = professores.map(professor =>
                        `<option value="${professor.id}">${professor.nome}</option>`
                    ).join('');
                    return `
                        <form id="cadastro-horario">
                            <div class="form-group">
                                <label for="professor">Professor</label>
                                <select id="professor" name="professor" required>
                                    <option value="">Selecione um professor</option>
                                    ${options}
                                </select>
                            </div>
                            <button type="submit" id="submit-btn">Gerar Horário <span class="spinner"></span></button>
                        </form>`;
                } catch (error) {
                    console.error("Erro ao carregar professores:", error);
                    return `<p>Erro ao carregar professores. Tente novamente.</p>`;
                }
            }
        };
        if (typeof forms[formType] === 'function') {
            return await forms[formType]();
        }
        return forms[formType];
    }

    function setupFormSubmitHandler(formType) {
        const formId = `cadastro-${formType}`;
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                if (formType === 'horario') {
                    await handleGenerateHorarioSubmit(form);
                } else if (formType === 'disciplina' || formType === 'sala') {
                    await handleMultipleItemsSubmit(formType, form);
                } else {
                    await handleFormSubmit(formType, form);
                }
                // Clear form data from sessionStorage after successful submission
                try {
                    sessionStorage.removeItem(`formData_${formType}`);
                } catch (error) {
                    console.warn(`Erro ao limpar formData_${formType} do sessionStorage:`, error);
                }
            });

            if (formType === 'disciplina' || formType === 'sala') {
                const addBtn = form.querySelector('#add-btn');
                const nomeInput = form.querySelector('#nome');
                const capacidadeInput = form.querySelector('#capacidade');

                nomeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem(formType, form);
                    }
                });
                if (capacidadeInput) {
                    capacidadeInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(formType, form);
                        }
                    });
                }

                addBtn.addEventListener('click', () => {
                    addItem(formType, form);
                });

                const addedItemsDiv = form.querySelector(`#added-${formType}s`);
                addedItemsDiv.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-item')) {
                        const index = parseInt(e.target.dataset.index);
                        tempItems.splice(index, 1);
                        updateAddedItems(formType, addedItemsDiv);
                    }
                });
            }
        } else {
            console.error(`Formulário ${formId} não encontrado`);
        }
    }

    function addItem(formType, form) {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        if (formType === 'disciplina') {
            data.nome = data.nome.trim();
            if (!data.nome) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'O campo nome não pode estar vazio!',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#29a8dc',
                    customClass: {
                        popup: 'my-swal-popup',
                        title: 'my-swal-title',
                        content: 'my-swal-text',
                        confirmButton: 'my-swal-button'
                    },
                    backdrop: 'rgba(0, 0, 0, 0.5)'
                });
                return;
            }
        } else if (formType === 'sala') {
            if (!data.nome) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'O campo nome é obrigatório!',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#29a8dc',
                    customClass: {
                        popup: 'my-swal-popup',
                        title: 'my-swal-title',
                        content: 'my-swal-text',
                        confirmButton: 'my-swal-button'
                    },
                    backdrop: 'rgba(0, 0, 0, 0.5)'
                });
                return;
            }
            if (!data.capacidade) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'O campo capacidade é obrigatório!',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#29a8dc',
                    customClass: {
                        popup: 'my-swal-popup',
                        title: 'my-swal-title',
                        content: 'my-swal-text',
                        confirmButton: 'my-swal-button'
                    },
                    backdrop: 'rgba(0, 0, 0, 0.5)'
                });
                return;
            }
        }

        tempItems.push({
            nome: data.nome,
            capacidade: formType === 'sala' ? parseInt(data.capacidade) : undefined,
            nomeNormalized: normalizeString(data.nome)
        });

        const addedItemsDiv = form.querySelector(`#added-${formType}s`);
        updateAddedItems(formType, addedItemsDiv);

        form.querySelector('#nome').value = '';
        if (formType === 'sala') {
            form.querySelector('#capacidade').value = '';
        }
        form.querySelector('#nome').focus();
    }

    function updateAddedItems(formType, addedItemsDiv) {
        addedItemsDiv.innerHTML = tempItems.map((item, index) => `
            <div class="item">
                <span>${item.nome}${formType === 'sala' ? ` (Capacidade: ${item.capacidade})` : ''}</span>
                <span class="remove-item" data-index="${index}">×</span>
            </div>
        `).join('');
    }

    async function handleMultipleItemsSubmit(formType, form) {
        const submitBtn = form.querySelector('#save-btn');
        const spinner = submitBtn.querySelector('.spinner');
        submitBtn.disabled = true;
        spinner.style.display = 'block';

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            if (tempItems.length === 0) throw new Error('Nada adicionado');

            const collectionName = getCollectionName(formType);
            const batch = db.batch();

            for (const item of tempItems) {
                const docData = {
                    nome: item.nome,
                    nomeNormalized: item.nomeNormalized,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: user.uid
                };
                if (formType === 'sala') {
                    docData.capacidade = item.capacidade;
                }
                await checkForDuplicate(formType, docData, user.uid);
                const docRef = db.collection(collectionName).doc();
                batch.set(docRef, docData);
            }

            await batch.commit();
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `${tempItems.length} ${formType === 'sala' ? 'salas' : 'disciplinas'} cadastradas com sucesso!`,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#2dbf78',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-button'
                },
                backdrop: 'rgba(0, 0, 0, 0.5)',
                timer: 2000,
                showConfirmButton: false
            });
            tempItems = [];
            form.querySelector(`#added-${formType}s`).innerHTML = '';
            form.reset();
            setTimeout(closeModal, 2000);
        } catch (error) {
            console.error(`Erro no cadastro de ${formType}:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Erro ao cadastrar: ${error.message}`,
                confirmButtonText: 'OK',
                confirmButtonColor: '#29a8dc',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-button'
                },
                backdrop: 'rgba(0, 0, 0, 0.5)'
            });
        } finally {
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async function checkForDuplicate(formType, data, userId) {
        const collectionName = getCollectionName(formType);
        if (formType === 'professor') {
            const nameQuery = await db.collection(collectionName)
                .where('nomeNormalized', '==', normalizeString(data.nome))
                .where('userId', '==', userId)
                .get();
            const emailQuery = await db.collection(collectionName)
                .where('emailNormalized', '==', normalizeString(data.email))
                .where('userId', '==', userId)
                .get();
            if (!nameQuery.empty) {
                throw new Error('Um professor com este nome já está cadastrado');
            }
            if (!emailQuery.empty) {
                throw new Error('Um professor com este e-mail já está cadastrado');
            }
        } else if (formType === 'sala') {
            const query = await db.collection(collectionName)
                .where('nomeNormalized', '==', normalizeString(data.nome))
                .where('capacidade', '==', data.capacidade)
                .where('userId', '==', userId)
                .get();
            if (!query.empty) {
                throw new Error('Uma sala com este nome e capacidade já está cadastrada');
            }
        } else if (formType === 'turma') {
            const query = await db.collection(collectionName)
                .where('nomeNormalized', '==', normalizeString(data.nome))
                .where('curso', '==', data.curso)
                .where('classe', '==', data.classe)
                .where('userId', '==', userId)
                .get();
            if (!query.empty) {
                throw new Error('Uma turma com este nome, curso e classe já está cadastrada');
            }
        } else {
            const query = await db.collection(collectionName)
                .where('nomeNormalized', '==', normalizeString(data.nome))
                .where('userId', '==', userId)
                .get();
            if (!query.empty) {
                throw new Error(`Um ${formType} com este nome já está cadastrado`);
            }
        }
    }

    async function handleFormSubmit(formType, form) {
        const submitBtn = form.querySelector('#submit-btn');
        const spinner = submitBtn.querySelector('.spinner');
        submitBtn.disabled = true;
        spinner.style.display = 'block';

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            const formData = new FormData(form);
            const data = {};
            const disciplinas = [];
            const classes = [];
            formData.forEach((value, key) => {
                if (key === 'disciplinas') {
                    disciplinas.push(value);
                } else if (key === 'classes') {
                    classes.push(value);
                } else {
                    data[key] = value;
                }
            });

            const selects = form.querySelectorAll('select');
            selects.forEach(select => {
                if (select.name && select.selectedOptions[0]) {
                    data[select.name] = select.selectedOptions[0].text;
                }
            });

            if (disciplinas.length > 0) {
                data.disciplinas = disciplinas;
            }
            if (classes.length > 0) {
                data.classes = classes;
            }
            if (formType === 'professor' && classes.length === 0) {
                throw new Error('Selecione pelo menos uma classe');
            }
            if (formType === 'professor' && disciplinas.length === 0) {
                throw new Error('Selecione pelo menos uma disciplina');
            }
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            data.userId = user.uid;
            if (formType === 'sala') {
                data.capacidade = parseInt(data.capacidade);
            }
            data.nomeNormalized = normalizeString(data.nome);
            if (formType === 'professor') {
                data.emailNormalized = normalizeString(data.email);
            }
            await checkForDuplicate(formType, data, user.uid);
            const collectionName = getCollectionName(formType);
            await db.collection(collectionName).add(data);
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `${capitalizeFirstLetter(formType)} cadastrado com sucesso!`,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#2dbf78',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-button'
                },
                backdrop: 'rgba(0, 0, 0, 0.5)',
                timer: 2000,
                showConfirmButton: false
            });
            form.reset();
            setTimeout(closeModal, 2000);
        } catch (error) {
            console.error(`Erro no cadastro de ${formType}:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Erro ao cadastrar: ${error.message}`,
                confirmButtonText: 'OK',
                confirmButtonColor: '#29a8dc',
                customClass: {
                    popup: 'my-swal-popup',
                    title: 'my-swal-title',
                    content: 'my-swal-text',
                    confirmButton: 'my-swal-button'
                },
                backdrop: 'rgba(0, 0, 0, 0.5)'
            });
        } finally {
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async function handleGenerateHorarioSubmit(form) {
        const submitBtn = form.querySelector('#submit-btn');
        const spinner = submitBtn.querySelector('.spinner');
        submitBtn.disabled = true;
        spinner.style.display = 'block';

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const professorId = data.professor;
            await generateProfessorSchedule(professorId, user.uid);
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Horário gerado com sucesso!',
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#2dbf78',
                customClass: 'modal',
                backdrop: 'rgba(0, 4, 4, 0.5)',
                timer: 2000,
                showConfirmButton: false
            });
            form.reset();
            setTimeout(() => {
                closeModal();
                window.location.href = `/horario?professorId=${professorId}`;
            }, 2000);
        } catch (error) {
            console.error('Erro ao gerar horário:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Erro ao gerar horário: ${error.message}`,
                confirmButtonText: 'OK',
                confirmButtonColor: '#29a8dc',
                customClass: 'modal',
                backdrop: 'rgba(0, 4, 4, 0.5)'
            });
        } finally {
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async function generateProfessorSchedule(professorId, userId) {
        const timeSlots = [
            { period: '1º', time: '7H00-7H50', session: 'manhã' },
            { period: '2º', time: '7H55-8H45', session: 'manhã' },
            { period: '3º', time: '8H50-9H40', session: 'manhã' },
            { period: '4º', time: '10H00-10H50', session: 'manhã' },
            { period: '5º', time: '10H55-11H45', session: 'manhã' },
            { period: '6º', time: '11H50-12H40', session: 'manhã' },
            { period: '1º', time: '13H00-13H50', session: 'tarde' },
            { period: '2º', time: '13H55-14H45', session: 'tarde' },
            { period: '3º', time: '14H50-15H40', session: 'tarde' },
            { period: '4º', time: '16H00-16H50', session: 'tarde' },
            { period: '5º', time: '16H55-17H45', session: 'tarde' }
        ];
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        const professorDoc = await db.collection('professores').doc(professorId).get();
        if (!professorDoc.exists) throw new Error('Professor não encontrado');
        const professor = professorDoc.data();
        const professorDisciplinas = professor.dis || [];
        const professorClasses = professor.classes || [];
        const turmasSnapshot = await db.collection('turmas').get();
        const cursosSnapshot = await db.collection('cursos').get();
        const salasSnapshot = await db.collection('salas').get();
        const disciplinasSnapshot = await db.collection('disciplinas').get();
        const turmas = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const cursos = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const salas = salasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const disciplines = disciplinasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const eligibleTurmas = turmas.filter(turma => {
            const turmaClasse = turma.classe || '';
            return professorClasses.includes(turmaClasse);
        });
        if (eligibleTurmas.length === 0) throw new Error('Nenhuma turma compatível com as classes do professor');
        const dayOff = days[Math.floor(Math.random() * days.length)];
        const workingDays = days.filter(day => day !== dayOff);
        const periodsPerDay = Math.ceil(24 / workingDays.length);
        const schedule = [];
        const occupied = {
            professor: {},
            salas: {},
            turmas: {}
        };
        for (const day of workingDays) {
            let periodsAssigned = 0;
            const availableSlots = [...timeSlots];
            while (periodsAssigned < periodsPerDay && availableSlots.length > 0 && schedule.length < 24) {
                const slotIndex = Math.floor(Math.random() * availableSlots.length);
                const slot = availableSlots.splice(slotIndex, 1)[0];
                const key = `${day}-${slot.time}`;
                if (occupied.professor[key] || occupied.salas[key] || occupied.turmas[key]) continue;
                const turma = eligibleTurmas[Math.floor(Math.random() * eligibleTurmas.length)];
                const curso = cursos.find(c => c.id === turma.curso);
                const turmaDisciplinas = curso && curso.disciplinas ? curso.disciplinas : [];
                const commonDisciplinaId = turmaDisciplinas.find(id => professorDisciplinas.includes(id));
                if (!commonDisciplinaId) continue;
                const disciplinaDoc = disciplines.find(d => d.id === commonDisciplinaId);
                if (!disciplinaDoc) continue;
                const availableSalas = salas.filter(sala => !occupied.salas[key] || !occupied.salas[key].includes(sala.id));
                if (availableSalas.length === 0) continue;
                const sala = availableSalas[Math.floor(Math.random() * availableSalas.length)];
                schedule.push({
                    professorId,
                    turmaId: turma.id,
                    salaId: sala.id,
                    disciplinaId: disciplinaDoc.id,
                    day,
                    timeSlot: slot.time,
                    session: slot.session,
                    period: slot.period,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId
                });
                occupied.professor[key] = professorId;
                occupied.salas[key] = occupied.salas[key] ? [...occupied.salas[key], sala.id] : [sala.id];
                occupied.turmas[key] = turma.id;
                periodsAssigned++;
            }
        }
        if (schedule.length < 24) {
            console.warn(`Apenas ${schedule.length} períodos atribuídos para o professor ${professorId}`);
        }
        const batch = db.batch();
        for (const entry of schedule) {
            const docRef = db.collection('horarios').doc();
            batch.set(docRef, entry);
        }
        await batch.commit();
        return schedule;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getCollectionName(formType) {
        const collections = {
            professor: 'professores',
            turma: 'turmas',
            disciplina: 'disciplinas',
            curso: 'cursos',
            sala: 'salas',
            horario: 'horarios'
        };
        return collections[formType] || `${formType}s`;
    }

    async function loadCursos() {
        try {
            const snapshot = await db.collection("cursos").get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nome,
                disciplinas: doc.data().disciplinas || []
            }));
        } catch (error) {
            console.error("Erro ao carregar cursos:", error);
            return [];
        }
    }

    async function loadProfessores() {
        try {
            const snapshot = await db.collection("professores").get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nome
            }));
        } catch (error) {
            console.error("Erro ao carregar professores:", error);
            return [];
        }
    }

    async function loadDisciplinas() {
        try {
            const snapshot = await db.collection("disciplinas").get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nome || '',
                nomeNormalized: doc.data().nomeNormalized || normalizeString(doc.data().nome || '')
            }));
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            return [];
        }
    }
});
