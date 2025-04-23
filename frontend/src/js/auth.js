// // Configuração do Firebase
// const firebaseConfig = {
//     apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
//     authDomain: "schedule-system-8c4b6.firebaseapp.com",
//     databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
//     projectId: "schedule-system-8c4b6",
//     storageBucket: "schedule-system-8c4b6.firebasestorage.app",
//     messagingSenderId: "1056197912318",
//     appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
//     measurementId: "G-GHEY7QZEQ9"
// };

// // Inicializa Firebase
// const app = firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();
// const db = firebase.firestore();

// // Elementos da UI
// const pageTransition = document.getElementById('pageTransition');
// const errorMessage = document.getElementById('errorMessage');

// // Mostrar loader
// function showLoader() {
//     if (pageTransition) pageTransition.style.display = 'flex';
// }

// // Esconder loader
// function hideLoader() {
//     if (pageTransition) pageTransition.style.display = 'none';
// }

// // Função para exibir mensagens de erro
// function showError(message) {
//     if (errorMessage) {
//         errorMessage.textContent = message;
//         setTimeout(() => errorMessage.textContent = '', 5000);
//     }
// }

// // Função para traduzir códigos de erro
// function getFriendlyErrorMessage(errorCode) {
//     const messages = {
//         'auth/invalid-email': 'Email inválido',
//         'auth/user-disabled': 'Conta desativada',
//         'auth/user-not-found': 'Usuário não encontrado',
//         'auth/wrong-password': 'Senha incorreta',
//         'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
//         'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
//     };
//     return messages[errorCode] || 'Erro ao fazer login';
// }

// // Verifica a página atual
// function getCurrentPage() {
//     return window.location.pathname.split('/').pop().split('.')[0];
// }

// // Único listener de estado de autenticação
// auth.onAuthStateChanged(async (user) => {
//     showLoader();
//     const currentPage = getCurrentPage();
    
//     try {
//         if (user) {
//             const doc = await db.collection('users').doc(user.uid).get();
            
//             if (!doc.exists) {
//                 await auth.signOut();
//                 if (currentPage !== 'index') {
//                     window.location.href = 'index.html';
//                 }
//                 return;
//             }
            
//             const userData = doc.data();
            
//             // Se estiver na página de login, redireciona para main
//             if (currentPage === 'index') {
//                 window.location.href = 'main.html';
//             } else if (typeof setupUI === 'function') {
//                 setupUI(userData);
//             }
//         } else {
//             // Usuário não logado - só redireciona se não estiver na página de login
//             if (currentPage !== 'index') {
//                 window.location.href = 'index.html';
//             }
//         }
//     } catch (error) {
//         console.error("Erro na verificação de autenticação:", error);
//         showError('Ocorreu um erro no sistema. Tente novamente.');
//     } finally {
//         hideLoader();
//     }
// });

// // Handler de login apenas se estiver na página de login
// if (getCurrentPage() === 'index') {
//     const loginForm = document.getElementById('loginForm');
//     if (loginForm) {
//         loginForm.addEventListener('submit', async (e) => {
//             e.preventDefault();
//             showLoader();
            
//             const email = document.getElementById('email').value;
//             const password = document.getElementById('password').value;

//             try {
//                 await auth.signInWithEmailAndPassword(email, password);
//             } catch (error) {
//                 showError(getFriendlyErrorMessage(error.code));
//             } finally {
//                 hideLoader();
//             }
//         });
//     }
// }

// // Handler de logout unificado
// const setupLogoutHandler = () => {
//     // Tenta encontrar por ID primeiro
//     const logoutButton = document.getElementById('logoutButton') || 
//                         document.querySelector('.nav-menu-bottom a[href="./index.html"]');
    
//     if (logoutButton) {
//         logoutButton.addEventListener('click', async (e) => {
//             e.preventDefault();
//             showLoader();
            
//             try {
//                 await auth.signOut();
//                 window.location.href = 'index.html';
//             } catch (error) {
//                 console.error('Erro ao fazer logout:', error);
//                 showError('Erro ao terminar sessão. Tente novamente.');
//             } finally {
//                 hideLoader();
//             }
//         });
//     }
// };

// // Chama o handler de logout quando o DOM estiver carregado
// document.addEventListener('DOMContentLoaded', setupLogoutHandler);