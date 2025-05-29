document.addEventListener("DOMContentLoaded", function () {
    console.log('docentesCounter.js loaded');

    const firebaseConfig = {
        apiKey: "AIzaSyA-3-WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
        authDomain: "schedule-system-8c4b6.firebaseapp.com",
        databaseURL: "https://schedule-system-8c4b6-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "schedule-system-8c4b6",
        storageBucket: "schedule-system-8c4b6.fireapp.com",
        messagingSenderId: "1056197912318",
        appId: "1:1056197912318:web:2861286c9a27bcc03587e27af",
        measurementId: "G-GHEY7QZEQ9"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    async function countProfessores() {
        console.log('countProfessores started');
        const docentesNumber = document.getElementById('docentesNumber');
        if (!docentesNumber) {
            console.error('Elemento #docentesNumber não encontrado');
            return;
        }

        const loadingSpinner = docentesNumber.querySelector('.loading-spinner');
        const countSpan = docentesNumber.querySelector('.countD');

        if (!loadingSpinner || !countSpan) {
            console.error('Elementos .loading-spinner ou .countD não encontrados em #docentesNumber');
            docentesNumber.textContent = '0';
            return;
        }

        loadingSpinner.classList.remove('hidden');
        countSpan.classList.add('hidden');

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('Usuário não autenticado');
                throw new Error('Usuário não autenticado');
                countSpan.textContent = '0';
                loadingSpinner.classList.add('hidden');
                countSpan.classList.remove('hidden');
                return;
            }

            // Check sessionStorage for cached count
            const cachedCount = sessionStorage.getItem(`professoresCount_${user.uid}`);
            if (cachedCount !== null) {
                console.log('Using cached count:', cachedCount);
                countSpan.textContent = cachedCount;
                loadingSpinner.classList.add('hidden');
                countSpan.classList.remove('hidden');
                return;
            }

            const snapshot = await db.collection('professores')
                .where('userId', '==', user.uid)
                .get();

            const count = snapshot.size;
            countSpan.textContent = count.toString();
            // Save to sessionStorage
            try {
                sessionStorage.setItem(`professoresCount_${user.uid}`, count);
            } catch (err) {
                console.warn('Erro ao salvar contador de professores no sessionStorage:', err);
            }
            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            console.log('Count updated:', count);
        } catch (error) {
            console.error('Erro ao contar professores:', error);
            countSpan.textContent = '0';
            loadingSpinner.classList.add('hidden');
            countSpan.classList.remove('hidden');
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.warn('Índice do Firestore necessário. Crie o índice no Firebase Console.');
            }
        }
    }

    firebase.auth().onAuthStateChanged(user => {
        console.log('Auth state:', user ? `User ${user.uid}` : 'No user');
        if (user) {
            countProfessores(user.uid);
        } else {
            const docentesNumber = document.getElementById('docentesNumber');
            if (docentesNumber) {
                const countSpan = docentesNumber.querySelector('.count');
                if (countSpan) {
                    countSpan.textContent = '0';
                    countSpan.classList.remove('hidden');
                    const loadingSpinner = docentesNumber.querySelector('.loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.classList.add('hidden');
                    }
                } else {
                    docentesNumber.textContent = '0';
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