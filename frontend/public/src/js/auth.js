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

// Define persistência de autenticação para evitar conflitos
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// Função para tentar operação com retries
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
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

// Função para tentar login com retries
async function attemptLogin(auth, email, password) {
    return withRetry(() => auth.signInWithEmailAndPassword(email, password));
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
                nome: user.displayName || '',
                nomeNormalized: (user.displayName || '').toLowerCase(),
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

// Manipula contagem regressiva com SweetAlert
function startLockoutTimer(lockoutSeconds = 60) {
    const loginForm = document.getElementById('loginForm');
    const submitButton = document.querySelector('.submit');

    if (!loginForm) return;

    // Desativa formulário
    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    submitButton?.classList.remove('spinner-active');

    // Define tempo de expiração
    const lockoutEnd = Date.now() + lockoutSeconds * 1000;
    sessionStorage.setItem('lockoutEnd', lockoutEnd);

    // Abre SweetAlert com timer
    Swal.fire({
        title: 'Bloqueado!',
        text: `Tente novamente em ${lockoutSeconds} segundos.`,
        icon: 'warning',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text' }
    });

    function updateTimer() {
        const secondsLeft = Math.max(0, Math.floor((lockoutEnd - Date.now()) / 1000));
        if (Swal.isVisible()) {
            Swal.getHtmlContainer().textContent = `Tente novamente em ${secondsLeft} segundos.`;
        }

        if (secondsLeft <= 0) {
            loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
            sessionStorage.removeItem('lockoutEnd');
            sessionStorage.removeItem('loginAttempts');
            Swal.close();
        } else {
            setTimeout(updateTimer, 1000);
        }
    }

    updateTimer();
}

// Verifica lockout ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const lockoutEnd = sessionStorage.getItem('lockoutEnd');
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        startLockoutTimer((parseInt(lockoutEnd) - Date.now()) / 1000);
    }
});

// Manipula o evento de submit do formulário de login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verifica se está em lockout
    const lockoutEnd = sessionStorage.getItem('lockoutEnd');
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        return;
    }

    // Adiciona a classe spinner-active ao botão
    const button = document.querySelector('.submit');
    if (button) {
        button.classList.add('spinner-active');
        button.disabled = true;
    }

    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();

    if (!email || !password) {
        if (button) {
            button.classList.remove('spinner-active');
            button.disabled = false;
        }
        Swal.fire({
            title: 'Erro!',
            text: 'Preencha todos os campos de login.',
            icon: 'error',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
        });
        return;
    }

    // Conta tentativas de login
    let attempts = parseInt(sessionStorage.getItem('loginAttempts') || '0');
    attempts += 1;
    sessionStorage.setItem('loginAttempts', attempts);

    try {
        const userCredential = await attemptLogin(auth, email, password);
        const user = userCredential.user;

        // Garante que documentos existem
        await ensureUserDocuments(user);

        // Limpa contagem de tentativas após login bem-sucedido
        sessionStorage.removeItem('loginAttempts');
        console.log('Usuário logado:', user.email);
        window.location.href = '/pagina-inicial';
    } catch (error) {
        // Remove a classe spinner-active e reativa o botão
        if (button) {
            button.classList.remove('spinner-active');
            button.disabled = false;
        }

        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Erro no login:', errorCode, errorMessage);

        // Verifica limite de tentativas
        if (attempts >= 3 || errorCode === 'auth/too-many-requests') {
            Swal.fire({
                title: 'Erro!',
                text: 'Muitas tentativas de login. Aguarde antes de tentar novamente.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            startLockoutTimer();
            return;
        }

        // Exibe mensagem de erro via SweetAlert
        Swal.fire({
            title: 'Erro!',
            text: getFriendlyErrorMessage(errorCode),
            icon: 'error',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
        });
    }
});

// Função para traduzir códigos de erro em mensagens amigáveis
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'O formato do email é inválido.';
        case 'auth/user-disabled':
            return 'Esta conta foi desactivada.';
        case 'auth/user-not-found':
            return 'Nenhum usuário encontrado com este email.';
        case 'auth/wrong-password':
            return 'Palavra-passe incorrecta.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas de login. Aguarde antes de tentar novamente.';
        case 'auth/network-request-failed':
            return 'Falha na rede. Verifique a sua ligação ou tente novamente.';
        case 'auth/invalid-login-credentials':
            return 'Email ou palavra-passe inválido. Tente novamente.';
        case 'auth/internal-error':
            return 'Erro interno do servidor. Verifique a sua ligação e tente novamente.';
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
}

// Monitora estado de autenticação para actualizar saudação
auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            console.log('Usuário autenticado:', user.uid);
            const professorDoc = await withRetry(() => db.collection('professores').doc(user.uid).get());
            const greeting = document.querySelector('.greeting');
            if (greeting) {
                if (professorDoc.exists && professorDoc.data().nome) {
                    greeting.textContent = `Bem-vindo, ${professorDoc.data().nome}!`;
                } else if (user.displayName) {
                    greeting.textContent = `Bem-vindo, ${user.displayName}!`;
                } else {
                    greeting.textContent = `Bem-vindo, ${user.email.split('@')[0]}!`;
                }
            }
        } else {
            console.log('Nenhum usuário autenticado, redireccionando para /login');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Erro no onAuthStateChanged:', error);
        Swal.fire({
            title: 'Erro!',
            text: getFriendlyErrorMessage(error.code || 'auth/internal-error'),
            icon: 'error',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
        });
        if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
            try {
                await auth.signOut();
                console.log('Sessão limpa devido a erro de autenticação');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } catch (signOutError) {
                console.error('Erro ao fazer logout:', signOutError);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao encerrar a sessão. Tente novamente.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                });
            }
        }
    }
});

// Manipula logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
        await auth.signOut();
        console.log('Usuário deslogado');
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Erro ao encerrar a sessão. Tente novamente.',
            icon: 'error',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
        });
    }
});