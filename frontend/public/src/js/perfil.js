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

// Inicialização do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Função para carregar e exibir os dados
async function loadUserData() {
    const user = firebase.auth().currentUser;

    if (!user) {
        console.log("Usuário não autenticado");
        window.location.href = '/login';
        return;
    }

    try {
        const doc = await db.collection('users').doc(user.uid).get();

        if (doc.exists) {
            const userData = doc.data();

            // Preencher seção de Dados Pessoais
            document.getElementById('account-name').textContent = userData.name || 'Não informado';
            document.getElementById('account-email').textContent = user.email || 'Não informado';
            document.getElementById('account-phone').textContent = userData.contacto || 'Não informado';
            document.getElementById('account-formacao-medio').textContent = userData.formacaoMedio || 'Não informado';
            document.getElementById('account-habilitacoes-superior').textContent = userData.habilitacoesSuperior || 'Não informado';

            // Preencher seção de Dados Profissionais
            document.getElementById('account-unidade-organica').textContent = userData.unidadeOrganica || 'Não informado';
            document.getElementById('account-categoria').textContent = userData.categoria || 'Não informado';
            document.getElementById('account-classe-leciona').textContent = userData.classeLeciona || 'Não informado';
            document.getElementById('account-disciplinas').textContent = userData.disciplinas || 'Não informado';
            document.getElementById('account-cargo-funcao').textContent = userData.role || 'Não informado';

        } else {
            console.log("Documento não encontrado");
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Carregar dados quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadUserData();
        } else {
            window.location.href = '/login';
        }
    });
});