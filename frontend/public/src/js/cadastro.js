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
        modal: document.getElementById("formModal"),
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
    function initializeModal() {
        UI.closeBtn.addEventListener("click", closeModal);
        UI.triggers.forEach(trigger => {
            trigger.addEventListener("click", function (e) {
                e.preventDefault();
                const formType = this.getAttribute("data-form");
                if (formType) {
                    loadForm(formType).catch(error => {
                        console.error("Erro ao carregar formulário:", error);
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
    }
    async function loadForm(formType) {
        try {
            UI.modalTitle.textContent = getModalTitle(formType);
            const formHTML = await generateFormHTML(formType);
            UI.modalBody.innerHTML = formHTML + '<p id="mensagem"></p>';
            setupFormSubmitHandler(formType);
        } catch (error) {
            console.error(`Erro ao carregar formulário ${formType}:`, error);
            throw error;
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
                            <button type="submit">Cadastrar</button>
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
                    <div class="form-group">
                        <label for="nome">Sala</label>
                        <input type="text" id="nome" name="nome" required>
                    </div>
                    <div class="form-group">
                        <label for="capacidade">Capacidade</label>
                        <input type="number" id="capacidade" min="1" name="capacidade" required>
                    </div>
                    <button type="submit">Cadastrar</button>
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
                                    <option value="10">10ª</option>
                                    <option value="11">11ª</option>
                                    <option value="12">12ª</option>
                                    <option value="13">13ª</option>
                                </select>
                            </div>
                            <button type="submit">Cadastrar</button>
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
                                <label for="formacao-medio">Formação do Ensino Médio</label>
                                <input type="text" id="formacao-medio" name="formacao-medio" required>
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
                            <button type="submit">Cadastrar</button>
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
                    <div class="form-group">
                        <label for="nome">Disciplina</label>
                        <input type="text" id="nome" name="nome" required>
                    </div>
                    <button type="submit">Cadastrar</button>
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
                            <button type="submit">Gerar Horário</button>
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
                } else {
                    await handleFormSubmit(formType, form);
                }
            });
        } else {
            console.error(`Formulário ${formId} não encontrado`);
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
        const message = document.getElementById("mensagem");
        if (!message) return;
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
            if (disciplinas.length > 0) {
                data.disciplinas = disciplinas;
            }
            if (classes.length > 0) {
                data.classes = classes;
            }
            if (formType === 'professor' && classes.length === 0) {
                throw new Error('Selecione pelo menos uma classe');
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
            showFeedback(message, `${capitalizeFirstLetter(formType)} cadastrado com sucesso!`, 'success');
            form.reset();
            setTimeout(closeModal, 2000);
        } catch (error) {
            console.error(`Erro no cadastro de ${formType}:`, error);
            showFeedback(message, `Erro ao cadastrar: ${error.message}`, 'error');
        }
    }
    async function handleGenerateHorarioSubmit(form) {
        const message = document.getElementById("mensagem");
        if (!message) return;
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const professorId = data.professor;
            await generateProfessorSchedule(professorId, user.uid);
            showFeedback(message, 'Horário gerado com sucesso!', 'success');
            form.reset();
            setTimeout(() => {
                closeModal();
                window.location.href = `/horario?professorId=${professorId}`;
            }, 2000);
        } catch (error) {
            console.error('Erro ao gerar horário:', error);
            showFeedback(message, `Erro ao gerar horário: ${error.message}`, 'error');
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
        const professorDisciplinas = professor.disciplinas || [];
        const professorClasses = professor.classes || [];
        console.log('Disciplinas do Professor:', professorDisciplinas);
        console.log('Classes do Professor:', professorClasses);
        const turmasSnapshot = await db.collection('turmas').get();
        const cursosSnapshot = await db.collection('cursos').get();
        const salasSnapshot = await db.collection('salas').get();
        const disciplinasSnapshot = await db.collection('disciplinas').get();
        const turmas = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const cursos = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const salas = salasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const disciplinas = disciplinasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Turmas:', turmas);
        console.log('Cursos:', cursos);
        const eligibleTurmas = turmas.filter(turma => {
            const turmaClasse = turma.classe || '';
            console.log(`Turma ${turma.nome} - Classe: ${turmaClasse}`);
            return professorClasses.includes(turmaClasse);
        });
        console.log('Turmas Elegíveis:', eligibleTurmas);
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
            while (periodsAssigned < periodsPerDay && availableSlots.length > 0 && periodsAssigned < 24 - schedule.length) {
                const slotIndex = Math.floor(Math.random() * availableSlots.length);
                const slot = availableSlots.splice(slotIndex, 1)[0];
                const key = `${day}-${slot.time}`;
                if (occupied.professor[key] || occupied.salas[key] || occupied.turmas[key]) continue;
                const turma = eligibleTurmas[Math.floor(Math.random() * eligibleTurmas.length)];
                const curso = cursos.find(c => c.id === turma.curso);
                const turmaDisciplinas = curso && curso.disciplinas ? curso.disciplinas : [];
                const commonDisciplinaId = turmaDisciplinas.find(id => professorDisciplinas.includes(id));
                if (!commonDisciplinaId) continue;
                const disciplinaDoc = disciplinas.find(d => d.id === commonDisciplinaId);
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
    function showFeedback(element, text, type) {
        element.textContent = text;
        element.className = type;
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
                nome: doc.data().nome
            }));
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            return [];
        }
    }
});