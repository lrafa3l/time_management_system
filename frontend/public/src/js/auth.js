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

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Autenticação com email e senha
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            const user = userCredential.user;
            console.log('Usuário logado:', user);
            window.location.href = '/pagina-inicial'; // Redireciona para a página principal
        })
        .catch((error) => {
            // Tratamento de erros
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Erro no login:', errorMessage);

            // Exibe mensagem de erro para o usuário
            document.getElementById('error-message').textContent = getFriendlyErrorMessage(errorCode);
        });
});

// Atualiza a UI com os dados do usuário
function setupUI(userData) {
    // Atualiza nome do usuário
    document.querySelector(".greeting").textContent = `Bem-vindo, ${userData.name || userData.email.split('@')[0]}!`;

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
        default:
            return 'Ocorreu um erro durante o login. Tente novamente.';
    }
}

