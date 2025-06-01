document.addEventListener('DOMContentLoaded', () => {
    console.log('turmasCRUD.js loaded at', new Date().toISOString());

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
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Falha na inicialização do Firebase.',
                confirmButtonColor: '#29a8dc',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
            });
            return;
        }
    }

    const db = firebase.firestore();
    const turmasTableBody = document.getElementById('turmasTableBody');
    const turmaModal = document.getElementById('turmaModal');
    const turmaForm = document.getElementById('turmaForm');
    const modalTitle = document.getElementById('modalTitle');
    let cursosCache = [];
    let salasCache = [];

    const normalizeString = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    async function loadDropdowns() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            console.log('Loading dropdowns for user:', user.uid);

            const cursosSnapshot = await db.collection('cursos').where('userId', '==', user.uid).get();
            cursosCache = cursosSnapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
            console.log('Cursos loaded:', cursosCache.length);
            const cursoSelect = document.getElementById('turmaCurso');
            cursoSelect.innerHTML = '<option value="">Selecione um curso</option>' +
                cursosCache.map(curso => `<option value="${curso.id}">${curso.nome}</option>`).join('');

            const salasSnapshot = await db.collection('salas').where('userId', '==', user.uid).get();
            salasCache = salasSnapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
            console.log('Salas loaded:', salasCache.length);
            const salaSelect = document.getElementById('turmaSala');
            salaSelect.innerHTML = '<option value="">Selecione uma sala</option>' +
                salasCache.map(sala => `<option value="${sala.id}">${sala.nome}</option>`).join('');
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível carregar cursos ou salas: ' + error.message,
                confirmButtonColor: '#29a8dc',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
            });
        }
    }

    async function loadTurmas() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            console.log('Loading turmas for user:', user.uid);

            // Show loading animation
            turmasTableBody.innerHTML = '<tr><td colspan="5" class="table-loading"><span class="spinner"></span> Carregando...</td></tr>';

            const snapshot = await db.collection('turmas')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            console.log('Turmas snapshot size:', snapshot.size);

            turmasTableBody.innerHTML = '';
            snapshot.forEach(doc => {
                const turma = { id: doc.id, ...doc.data() };
                const curso = cursosCache.find(c => c.id === turma.curso) || { nome: 'N/A' };
                const sala = salasCache.find(s => s.id === turma.sala) || { nome: 'N/A' };
                console.log('Rendering turma:', turma.nome);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 text-sm">${turma.nome}</td>
                    <td class="px-6 py-4 text-sm">${sala.nome}</td>
                    <td class="px-6 py-4 text-sm">${curso.nome}</td>
                    <td class="px-6 py-4 text-sm">${turma.turno || 'N/A'}</td>
                    <td class="px-6 py-4 text-right">
                        <button class="btn-edit" onclick="editTurma('${turma.id}')"><i class="fas fa-edit mr-1"></i>Editar</button>
                        <button class="btn-danger" onclick="deleteTurma('${turma.id}', '${turma.nome}')"><i class="fas fa-trash mr-1"></i>Excluir</button>
                    </td>
                `;
                turmasTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading turmas:', error);
            turmasTableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Erro ao carregar turmas.</td></tr>';
            let errorMessage = 'Não foi possível carregar turmas: ' + error.message;
            if (error.message.includes('The query requires an index')) {
                errorMessage = 'A consulta requer um índice no Firestore. Crie-o aqui: ' +
                    '<a href="https://console.firebase.google.com/v1/r/project/schedule-system-8c4b6/firestore/indexes?create_composite=ClRwcm9qZWN0cy9zY2hlZHVsZS1zeXN0ZW0tOGM0YjYvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3R1cm1hcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC" target="_blank">Criar Índice</a>';
            }
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                html: errorMessage,
                confirmButtonColor: '#29a8dc',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
            });
        }
    }

    window.openTurmaModal = (isEdit = false) => {
        modalTitle.textContent = isEdit ? 'Editar Turma' : 'Adicionar Turma';
        turmaModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        loadDropdowns();
    };

    window.closeTurmaModal = () => {
        turmaModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        turmaForm.reset();
        document.getElementById('turmaId').value = '';
    };

    turmaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitButton = turmaForm.querySelector('button[type="submit"]');
        const submitSpinner = submitButton.querySelector('.spinner');
        const submitText = submitButton.querySelector('.btn-text');

        // Show button loading animation
        submitButton.disabled = true;
        submitButton.classList.add('btn-loading');
        submitSpinner.classList.remove('hidden');
        submitText.textContent = 'Salvando...';

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            console.log('Submitting form for user:', user.uid);

            const id = document.getElementById('turmaId').value;
            const data = {
                nome: document.getElementById('turmaNome').value.trim(),
                sala: document.getElementById('turmaSala').value,
                curso: document.getElementById('turmaCurso').value,
                turno: document.getElementById('turmaTurno').value,
                nomeNormalized: normalizeString(document.getElementById('turmaNome').value.trim()),
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            console.log('Form data:', data);

            if (!data.nome || !data.sala || !data.curso || !data.turno) {
                throw new Error('Todos os campos são obrigatórios.');
            }

            const query = await db.collection('turmas')
                .where('nomeNormalized', '==', data.nomeNormalized)
                .where('curso', '==', data.curso)
                .where('userId', '==', user.uid)
                .get();

            if (!query.empty && !id) {
                throw new Error('Já existe uma turma com este nome e curso.');
            }

            if (id) {
                await db.collection('turmas').doc(id).update(data);
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'Turma atualizada com sucesso!',
                    confirmButtonColor: '#29a8dc',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
                });
            } else {
                await db.collection('turmas').add(data);
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'Turma criada com sucesso!',
                    confirmButtonColor: '#29a8dc',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
                });
            }

            closeTurmaModal();
            loadTurmas();
        } catch (error) {
            console.error('Error saving turma:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: error.message,
                confirmButtonColor: '#29a8dc',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
            });
        } finally {
            // Hide button loading animation
            submitButton.disabled = false;
            submitButton.classList.remove('btn-loading');
            submitSpinner.classList.add('hidden');
            submitText.textContent = 'Salvar';
        }
    });

    window.editTurma = async id => {
        try {
            console.log('Editing turma:', id);
            const doc = await db.collection('turmas').doc(id).get();
            if (!doc.exists) throw new Error('Turma não encontrada.');

            const turma = doc.data();
            document.getElementById('turmaId').value = id;
            document.getElementById('turmaNome').value = turma.nome;
            document.getElementById('turmaSala').value = turma.sala;
            document.getElementById('turmaCurso').value = turma.curso;
            document.getElementById('turmaTurno').value = turma.turno;

            openTurmaModal(true);
        } catch (error) {
            console.error('Error editing turma:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível carregar a turma: ' + error.message,
                confirmButtonColor: '#29a8dc',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
            });
        }
    };

    window.deleteTurma = (id, nome) => {
        Swal.fire({
            title: `Excluir "${nome}"?`,
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
        }).then(async result => {
            if (result.isConfirmed) {
                try {
                    // Show centered loading spinner in the same modal
                    Swal.showLoading();
                    console.log('Deleting turma:', id);

                    await db.collection('turmas').doc(id).delete();

                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Excluído',
                        text: 'Turma removida com sucesso!',
                        confirmButtonColor: '#29a8dc',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
                    });
                    loadTurmas();
                } catch (error) {
                    console.error('Error deleting turma:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: 'Não foi possível excluir a turma: ' + error.message,
                        confirmButtonColor: '#29a8dc',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-button' }
                    });
                }
            }
        });
    };

    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state changed:', user ? user.uid : 'No user');
        if (user) {
            loadTurmas();
            loadDropdowns();
        } else {
            console.log('Redirecting to login');
            window.location.href = '/';
        }
    });

    document.getElementById('createTurmaButton').addEventListener('click', () => {
        console.log('Opening create turma modal');
        openTurmaModal();
    });
});