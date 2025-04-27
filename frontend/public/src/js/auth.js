// Configuração do Firebase
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

// Manipula o evento de submit do formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Adiciona a classe loading ao botão
    const button = document.querySelector('.submit');
    button.classList.add('loading');
    button.disabled = true; // Desativa o botão para evitar cliques repetidos

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await attemptLogin(auth, email, password);
        const user = userCredential.user;

        // Atualiza a UI com os dados do usuário (opcional)
        setupUI({ email: user.email, name: user.displayName });

        console.log('Usuário logado:', user);
        window.location.href = '/pagina-inicial'; // Redireciona para main.html
    } catch (error) {
        // Remove a classe loading e reativa o botão
        button.classList.remove('loading');
        button.disabled = false;

        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Erro no login:', errorMessage);

        // Exibe mensagem de erro amigável
        document.getElementById('error-message').textContent = getFriendlyErrorMessage(errorCode);
    }
});

// Atualiza a UI com os dados do usuário
function setupUI(userData) {
    const greeting = document.querySelector(".greeting");
    if (greeting) {
        greeting.textContent = `Bem-vindo, ${userData.name || userData.email.split('@')[0]}!`;
    }
}

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
        default:
            return 'Ocorreu um erro durante o login. Tente novamente.';
    }
}