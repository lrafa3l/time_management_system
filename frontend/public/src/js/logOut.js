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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const adminId = user.uid;
                    sessionStorage.removeItem(`adminUsers_${adminId}`);
                    console.log(`Cache adminUsers_${adminId} limpo no logout`);
                }
                await auth.signOut();
                window.location.href = '/login';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Não foi possível fazer logout. Tente novamente.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                });
            }
        });
    }
});