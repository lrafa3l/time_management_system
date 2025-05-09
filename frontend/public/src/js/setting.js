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

    // Accordion toggle functionality
    document.querySelectorAll('.toggle-section').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const isOpen = content.style.display === 'block';
            document.querySelectorAll('.section-content').forEach(c => {
                c.style.display = 'none';
            });
            content.style.display = isOpen ? 'none' : 'block';
        });
    });

    // Load user settings
    async function loadSettings() {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const settingsDoc = await db.collection('users').doc(user.uid).collection('settings').doc('preferences').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                document.getElementById('calendar-view').value = settings.calendarView || 'weekly';
                document.getElementById('profile-visible').checked = settings.profileVisible || false;
                document.getElementById('schedule-alerts').checked = settings.scheduleAlerts || false;
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    // Save settings
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(settingsForm);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        const calendarView = formData.get('calendarView');
        const profileVisible = formData.get('profileVisible') === 'on';
        const scheduleAlerts = formData.get('scheduleAlerts') === 'on';

        showLoadingSpinner();

        try {
            const user = auth.currentUser;
            // Update password if provided
            if (currentPassword && newPassword && confirmPassword) {
                if (newPassword !== confirmPassword) {
                    Swal.fire({
                        title: 'Erro!',
                        text: 'As novas senhas não coincidem.',
                        icon: 'error',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                    return;
                }
                if (newPassword.length < 6) {
                    Swal.fire({
                        title: 'Erro!',
                        text: 'A nova senha deve ter pelo menos 6 caracteres.',
                        icon: 'error',
                        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                    });
                    return;
                }
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);
            }

            // Save settings to Firestore
            await db.collection('users').doc(user.uid).collection('settings').doc('preferences').set({
                calendarView,
                profileVisible,
                scheduleAlerts
            }, { merge: true });

            Swal.fire({
                title: 'Sucesso!',
                text: 'Configurações salvas com sucesso.',
                icon: 'success',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            settingsForm.reset();
            loadSettings();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            let message = 'Não foi possível salvar as configurações. Tente novamente.';
            if (error.code === 'auth/wrong-password') {
                message = 'A senha atual está incorreta.';
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
            window.location.href = '/login';
        }
    });
});