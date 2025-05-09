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

    const profileForm = document.getElementById('profile-form');
    const editButton = document.getElementById('edit-profile-btn');
    const cancelButton = document.getElementById('cancel-profile-btn');
    let isEditMode = false;

    function showLoadingSpinner() {
        Swal.fire({
            title: 'Processando...',
            html: '<div class="swal-spinner"></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title' }
        });
    }

    async function loadUserData() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/login';
            return;
        }
        try {
            const doc = await db.collection('professores').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('account-name').textContent = userData.nome || 'Não informado';
                document.getElementById('account-email').textContent = user.email || 'Não informado';
                document.getElementById('account-phone').textContent = userData.contacto || 'Não informado';
                document.getElementById('account-formacao-medio').textContent = userData.formacaoMedio || 'Não informado';
                document.getElementById('account-habilitacoes-superior').textContent = userData.habilitacoes || 'Não informado';
                document.getElementById('account-unidade-organica').textContent = userData.unidade || 'Não informado';
                document.getElementById('account-categoria').textContent = userData.categoria || 'Não informado';
                document.getElementById('account-classe-leciona').textContent = Array.isArray(userData.classes) ? userData.classes.join(', ') : 'Não informado';
                document.getElementById('account-disciplinas').textContent = Array.isArray(userData.disciplinas) ? userData.disciplinas.join(', ') : 'Não informado';
                document.getElementById('account-cargo-funcao').textContent = userData.cargo || 'Não informado';
                if (isEditMode) {
                    document.getElementById('edit-name').value = userData.nome || '';
                    document.getElementById('edit-email').value = user.email || '';
                    document.getElementById('edit-phone').value = userData.contacto || '';
                    document.getElementById('edit-formacao-medio').value = userData.formacaoMedio || '';
                    document.getElementById('edit-habilitacoes-superior').value = userData.habilitacoes || '';
                    document.getElementById('edit-unidade-organica').value = userData.unidade || '';
                    document.getElementById('edit-categoria').value = userData.categoria || '';
                    document.getElementById('edit-classe-leciona').value = Array.isArray(userData.classes) ? userData.classes.join(', ') : '';
                    document.getElementById('edit-disciplinas').value = Array.isArray(userData.disciplinas) ? userData.disciplinas.join(', ') : '';
                    document.getElementById('edit-cargo-funcao').value = userData.cargo || '';
                }
            } else {
                console.log("Documento não encontrado em professores");
                Swal.fire({
                    title: 'Erro!',
                    text: 'Dados do perfil não encontrados.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                });
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível carregar os dados. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        }
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        const detailValues = document.querySelectorAll('.detail-value');
        const detailInputs = document.querySelectorAll('.detail-input');
        if (isEditMode) {
            detailValues.forEach(span => span.classList.add('hidden'));
            detailInputs.forEach(input => input.classList.remove('hidden'));
            editButton.textContent = 'Salvar';
            editButton.classList.add('bg-green-500', 'hover:bg-green-600');
            editButton.classList.remove('bg-[#29a8dc]', 'hover:bg-[#2195c3]');
            cancelButton.classList.remove('hidden');
            loadUserData(); // Populate inputs
        } else {
            detailValues.forEach(span => span.classList.remove('hidden'));
            detailInputs.forEach(input => input.classList.add('hidden'));
            editButton.textContent = 'Editar Perfil';
            editButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            editButton.classList.add('bg-[#29a8dc]', 'hover:bg-[#2195c3]');
            cancelButton.classList.add('hidden');
        }
    }

    async function saveProfileChanges() {
        showLoadingSpinner();
        const formData = new FormData(profileForm);
        const updatedData = {
            nome: formData.get('nome') || '',
            nomeNormalized: (formData.get('nome') || '').toLowerCase(),
            email: auth.currentUser.email,
            emailNormalized: (auth.currentUser.email || '').toLowerCase(),
            contacto: formData.get('contacto') || '',
            formacaoMedio: formData.get('formacaoMedio') || '',
            habilitacoes: formData.get('habilitacoes') || '',
            unidade: formData.get('unidade') || '',
            categoria: formData.get('categoria') || '',
            classes: formData.get('classes') ? formData.get('classes').split(',').map(s => s.trim()) : [],
            disciplinas: formData.get('disciplinas') ? formData.get('disciplinas').split(',').map(s => s.trim()) : [],
            cargo: formData.get('cargo') || '',
            userId: auth.currentUser.uid
        };
        try {
            await db.collection('professores').doc(auth.currentUser.uid).set(updatedData, { merge: true });
            Swal.fire({
                title: 'Sucesso!',
                text: 'Perfil atualizado com sucesso.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            toggleEditMode();
            loadUserData();
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível atualizar o perfil. Tente novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        }
    }

    editButton.addEventListener('click', () => {
        if (isEditMode) {
            saveProfileChanges();
        } else {
            toggleEditMode();
        }
    });

    cancelButton.addEventListener('click', () => {
        toggleEditMode();
        loadUserData(); // Reload original data to reset any changes
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadUserData();
        } else {
            window.location.href = '/login';
        }
    });
});