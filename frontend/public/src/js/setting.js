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
    const auth = firebase.auth();
    const db = firebase.firestore();

    const settingsForm = document.getElementById('settings-form');

    function showLoadingSpinner() {
        Swal.fire({
            title: 'Processando...',
            html: '<div class="swal-spinner"></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title' }
        });
    }

    // Cache settings in sessionStorage
    function cacheSettings(user, settings) {
        try {
            const settingsData = {
                calendarView: settings.calendarView || 'weekly',
                profileVisible: settings.profileVisible || false,
                scheduleAlerts: settings.scheduleAlerts || false
            };
            sessionStorage.setItem(`userSettings_${user.uid}`, JSON.stringify(settingsData));
            console.log(`Configurações do usuário ${user.uid} cacheadas com sucesso`);
        } catch (error) {
            console.warn('Erro ao salvar configurações no sessionStorage:', error);
            if (error.name === 'QuotaExceededError') {
                console.warn('Limite de sessionStorage excedido. Limpando dados antigos.');
                sessionStorage.removeItem(`userSettings_${user.uid}`);
                try {
                    sessionStorage.setItem(`userSettings_${user.uid}`, JSON.stringify(settingsData));
                } catch (innerErr) {
                    console.warn('Falha ao salvar após limpeza:', innerErr);
                }
            }
        }
    }

    // Accordion toggle functionality
    document.querySelectorAll('.toggle-section').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const isOpen = content.style.display === 'block';

            // Close all sections and remove active class
            document.querySelectorAll('.section-content').forEach(c => {
                c.style.display = 'none';
            });
            document.querySelectorAll('.toggle-section').forEach(h => {
                h.classList.remove('active');
                h.querySelector('.toggle-arrow').classList.remove('fa-chevron-up');
                h.querySelector('.toggle-arrow').classList.add('fa-chevron-down');
            });

            // Toggle current section
            if (!isOpen) {
                content.style.display = 'block';
                header.classList.add('active');
                header.querySelector('.toggle-arrow').classList.remove('fa-chevron-down');
                header.querySelector('.toggle-arrow').classList.add('fa-chevron-up');
            }
        });
    });

    // Load user settings
    async function loadSettings() {
        const user = auth.currentUser;
        if (!user) {
            console.log('Nenhum usuário autenticado, redirecionando para /login');
            window.location.href = '/login';
            return;
        }

        // Check cache first
        try {
            const cachedSettings = sessionStorage.getItem(`userSettings_${user.uid}`);
            if (cachedSettings) {
                const settings = JSON.parse(cachedSettings);
                console.log(`Carregando configurações do cache para ${user.uid}`);
                document.getElementById('calendar-view').value = settings.calendarView || 'weekly';
                document.getElementById('profile-visible').checked = settings.profileVisible || false;
                document.getElementById('schedule-alerts').checked = settings.scheduleAlerts || false;
                return;
            }
        } catch (error) {
            console.warn('Erro ao recuperar configurações do sessionStorage:', error);
        }

        // Load from Firestore if no cache
        try {
            const settingsDoc = await db.collection('users').doc(user.uid).collection('settings').doc('preferences').get();
            let settings = {
                calendarView: 'weekly',
                profileVisible: false,
                scheduleAlerts: false
            };
            if (settingsDoc.exists) {
                settings = { ...settings, ...settingsDoc.data() };
            } else {
                // Create default settings if document doesn't exist
                await db.collection('users').doc(user.uid).collection('settings').doc('preferences').set(settings);
                console.log(`Configurações padrão criadas para o usuário ${user.uid}`);
            }
            document.getElementById('calendar-view').value = settings.calendarView;
            document.getElementById('profile-visible').checked = settings.profileVisible;
            document.getElementById('schedule-alerts').checked = settings.scheduleAlerts;

            // Cache the loaded settings
            cacheSettings(user, settings);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            let message = 'Não foi possível carregar as configurações. Tente novamente.';
            if (error.code === 'firestore/permission-denied') {
                message = 'Permissão negada para acessar as configurações. Contacte o administrador.';
            } else if (error.code === 'firestore/unavailable') {
                message = 'Serviço indisponível. Verifique sua conexão com a internet.';
            } else if (error.code === 'firestore/not-found') {
                message = 'Configurações não encontradas. Criando configurações padrão.';
            }
            Swal.fire({
                title: 'Erro!',
                text: message,
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        }
    }

    // Save settings
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(settingsForm);
        const currentPassword = formData.get('currentPassword')?.trim();
        const newPassword = formData.get('newPassword')?.trim();
        const confirmPassword = formData.get('confirmPassword')?.trim();
        const calendarView = formData.get('calendarView');
        const profileVisible = formData.get('profileVisible') === 'on';
        const scheduleAlerts = formData.get('scheduleAlerts') === 'on';

        showLoadingSpinner();

        try {
            const user = auth.currentUser;
            if (!user) {
                Swal.close();
                window.location.href = '/login';
                return;
            }

            // Update password only if all three fields are filled
            if (currentPassword || newPassword || confirmPassword) {
                if (!currentPassword || !newPassword || !confirmPassword) {
                    Swal.fire({
                        title: 'Erro!',
                        text: 'Preencha todos os campos de senha (atual, nova e confirmação).',
                        icon: 'error',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                    return;
                }
                if (newPassword !== confirmPassword) {
                    Swal.fire({
                        title: 'Erro!',
                        text: 'As novas senhas não coincidem.',
                        icon: 'error',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                    return;
                }
                if (newPassword.length < 8) {
                    Swal.fire({
                        title: 'Erro!',
                        text: 'A nova senha deve ter pelo menos 8 caracteres.',
                        icon: 'error',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                    return;
                }
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);
                console.log('Senha atualizada com sucesso');
                // Força logout após mudança de senha
                await auth.signOut();
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Senha alterada com sucesso. Faça login novamente.',
                    icon: 'success',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                }).then(() => {
                    window.location.href = '/login';
                });
                return; // Sai após mudança de senha
            }

            // Save settings to Firestore
            const settings = {
                calendarView,
                profileVisible,
                scheduleAlerts
            };
            await db.collection('users').doc(user.uid).collection('settings').doc('preferences').set(settings, { merge: true });

            // Cache the updated settings
            cacheSettings(user, settings);

            Swal.fire({
                title: 'Sucesso!',
                text: 'Configurações salvas com sucesso.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });

            // Clear only password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';

            loadSettings();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            let message = 'Não foi possível salvar as configurações. Tente novamente.';
            if (error.code === 'auth/wrong-password') {
                message = 'A senha atual está incorreta.';
            } else if (error.code === 'auth/internal-error') {
                message = 'Erro interno do servidor. Verifique sua conexão e tente novamente.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Muitas tentativas. Tente novamente mais tarde.';
            } else if (error.code === 'firestore/permission-denied') {
                message = 'Permissão negada para salvar configurações. Contacte o administrador.';
            }
            Swal.fire({
                title: 'Erro!',
                text: message,
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        }
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadSettings();
        } else {
            console.log('Nenhum usuário autenticado, redirecionando para /login');
            window.location.href = '/login';
        }
    });
});