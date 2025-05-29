document.addEventListener("DOMContentLoaded", function () {
    console.log('horarioCounter.js loaded');

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
        authDomain: "schedule-system-8c4b6.firebaseapp.com",
        databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
        projectId: "schedule-system-8c4b6",
        storageBucket: "schedule-system-8c4b6.appspot.com",
        messagingSenderId: "1056197912318",
        appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
        measurementId: "G-GHEY7QZEQ9"
    };

    // Check if Firebase SDK is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK não carregado. Verifique os scripts incluídos no HTML.');
        const horarioNumber = document.getElementById('horarioNumber');
        if (horarioNumber) {
            const countSpan = horarioNumber.querySelector('.countH');
            if (countSpan) {
                countSpan.textContent = '0';
                countSpan.classList.remove('hidden');
                const loadingSpinner = horarioNumber.querySelector('.loading-spinner');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        }
        return;
    }

    // Initialize Firebase
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
        } catch (error) {
            console.error('Erro na inicialização do Firebase:', error);
            return;
        }
    }
    const db = firebase.firestore();

    // Function to count horarios and update DOM
    async function countHorarios(userId) {
        console.log('countHorarios started');
        const horarioNumber = document.getElementById('horarioNumber');
        if (!horarioNumber) {
            console.error('Elemento #horarioNumber não encontrado');
            return;
        }

        const loadingSpinner = horarioNumber.querySelector('.loading-spinner');
        const countSpan = horarioNumber.querySelector('.countH');

        if (!loadingSpinner || !countSpan) {
            console.error('Elementos .loading-spinner ou .countH não encontrados em #horarioNumber');
            if (countSpan) countSpan.textContent = '0';
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            return;
        }

        loadingSpinner.classList.remove('hidden');
        countSpan.classList.add('hidden');

        try {
            // Check sessionStorage for cached count
            const cachedCount = sessionStorage.getItem(`horariosCount_${userId}`);
            if (cachedCount !== null) {
                console.log('Using cached count:', cachedCount);
                countSpan.textContent = cachedCount;
                loadingSpinner.classList.add('hidden');
                countSpan.classList.remove('hidden');
                return;
            }

            // Firestore query
            const snapshot = await db.collection('horarios')
                .where('userId', '==', userId)
                .get();

            const count = snapshot.size;
            countSpan.textContent = count.toString();

            // Save to sessionStorage with quota handling
            try {
                sessionStorage.setItem(`horariosCount_${userId}`, count);
            } catch (err) {
                console.warn('Erro ao salvar contador de horarios no sessionStorage:', err);
                if (err.name === 'QuotaExceededError') {
                    console.warn('Limite de sessionStorage excedido. Limpando dados antigos.');
                    sessionStorage.removeItem(`horariosCount_${userId}`);
                    try {
                        sessionStorage.setItem(`horariosCount_${userId}`, count);
                    } catch (innerErr) {
                        console.warn('Falha ao salvar após limpeza:', innerErr);
                    }
                }
            }

            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            console.log('Count updated:', count);
        } catch (error) {
            console.error('Erro ao contar os horarios:', error);
            countSpan.textContent = '0';
            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.warn('Índice do Firestore necessário. Crie o índice no Firebase Console para a coleção "horarios" com o campo "userId".');
            }
        }
    }

    // Initialize on auth state change
    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state:', user ? `User ${user.uid}` : 'No user');
        if (user) {
            countHorarios(user.uid);
        } else {
            const horarioNumber = document.getElementById('horarioNumber');
            if (horarioNumber) {
                const countSpan = horarioNumber.querySelector('.countH'); // Fixed selector
                if (countSpan) {
                    countSpan.textContent = '0';
                    countSpan.classList.remove('hidden');
                    const loadingSpinner = horarioNumber.querySelector('.loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.classList.add('hidden');
                    }
                } else {
                    console.warn('Elemento .countH não encontrado em #horarioNumber');
                }
            }
            // Clear sessionStorage on logout
            try {
                sessionStorage.clear();
            } catch (error) {
                console.warn('Erro ao limpar sessionStorage:', error);
            }
        }
    });
});