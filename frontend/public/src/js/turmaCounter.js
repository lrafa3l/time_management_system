document.addEventListener("DOMContentLoaded", function () {
    console.log('turmaCounter.js loaded');

    // Firebase configuration
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

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // Function to count Turmas and update DOM
    async function countTurmas() {
        console.log('count turmas started');
        const turmaNumber = document.getElementById('turmaNumber');
        if (!turmaNumber) {
            console.error('Elemento #turmaNumber não encontrado');
            return;
        }

        const loadingSpinner = turmaNumber.querySelector('.loading-spinner');
        const countSpan = turmaNumber.querySelector('.countT');

        console.log('loadingSpinner:', loadingSpinner, 'countSpinner:', countSpan);

        if (!loadingSpinner || !countSpan) {
            console.error('Elementos .loading-spinner ou .count não encontrados em #turmaNumber');
            turmaNumber.textContent = '0';
            return;
        }

        // Ensure spinner is visible
        loadingSpinner.classList.remove('hidden');
        countSpan.classList.add('hidden');
        console.log('Spinner should be visible:', !loadingSpinner.classList.contains('hidden'));

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('Usuário não autenticado');
                countSpan.textContent = '0';
                loadingSpinner.classList.add('hidden');
                countSpan.classList.remove('hidden');
                return;
            }

            // Temporary delay to test spinner visibility
            await new Promise(resolve => setTimeout(resolve, 1000));

            const snapshot = await db.collection('turmas')
                .where('userId', '==', user.uid)
                .get();

            const count = snapshot.size;
            countSpan.textContent = count.toString();
            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            console.log('Count updated:', count);
        } catch (error) {
            console.error('Erro ao contar as turmas:', error);
            countSpan.textContent = '0';
            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.warn('Índice do Firestore necessário. Crie o índice no Firebase Console.');
            }
        }
    }

    // Initialize on auth state change
    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state:', user ? `User ${user.uid}` : 'No user');
        if (user) {
            countTurmas();
        } else {
            const turmaNumber = document.getElementById('turmaNumber');
            if (turmaNumber) {
                const countSpan = turmaNumber.querySelector('.count');
                if (countSpan) {
                    countSpan.textContent = '0';
                    countSpan.classList.remove('hidden');
                    const loadingSpinner = turmaNumber.querySelector('.loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.classList.add('hidden');
                    }
                } else {
                    turmaNumber.textContent = '0';
                }
            }
        }
    });
});