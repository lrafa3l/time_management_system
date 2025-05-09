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

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função para tentar login com retries em caso de falha de rede
async function attemptLogin(auth, email, password, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential;
        } catch (error) {
            if (error.code === 'auth/network-request-failed' && i < retries - 1) {
                console.warn(`Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

// Função para garantir que documentos users e professores existem
async function ensureUserDocuments(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const professorRef = db.collection('professores').doc(user.uid);
        
        // Verifica users document
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.log(`Criando users document para ${user.uid}`);
            await userRef.set({
                role: 'user' // Default role
            });
        }

        // Verifica professores document
        const professorDoc = await professorRef.get();
        if (!professorDoc.exists) {
            console.log(`Criando professores document para ${user.uid}`);
            await professorRef.set({
                nome: '',
                nomeNormalized: '',
                email: user.email || '',
                emailNormalized: (user.email || '').toLowerCase(),
                contacto: '',
                formacaoMedio: '',
                habilitacoes: '',
                unidade: '',
                categoria: '',
                classes: [],
                disciplinas: [],
                cargo: '',
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Erro ao garantir documentos do usuário:', error);
        throw new Error('Falha ao configurar dados do usuário.');
    }
}

// Manipula o evento de submit do formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Adiciona a classe loading ao botão
    const button = document.querySelector('.submit');
    button.classList.add('loading');
    button.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await attemptLogin(auth, email, password);
        const user = userCredential.user;

        // Garante que documentos existem
        await ensureUserDocuments(user);

        console.log('Usuário logado:', user.email);
        window.location.href = '/pagina-inicial';
    } catch (error) {
        // Remove a classe loading e reativa o botão
        button.classList.remove('loading');
        button.disabled = false;

        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Erro no login:', errorCode, errorMessage);

        // Exibe mensagem de erro amigável
        document.getElementById('error-message').textContent = getFriendlyErrorMessage(errorCode);
    }
});

// Função para traduzir códigos de erro em mensagens amigáveis
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'O formato do email é inválido.';
        case 'auth/user-disabled':
            return 'Esta conta foi desativada.';
        case 'auth/user-not-found':
            return 'Nenhum usuário encontrado com este email.';
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas de login. Tente novamente mais tarde.';
        case 'auth/network-request-failed':
            return 'Falha na rede. Verifique sua conexão ou tente novamente.';
        case 'auth/invalid-login-credentials':
            return 'E-mail ou palavra-passe inválido. Tente novamente.';
        default:
            return 'Ocorreu um erro durante o login. Tente novamente.';
    }
}