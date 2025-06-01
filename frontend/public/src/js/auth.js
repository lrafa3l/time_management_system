// Sistema de Autenticação - Time Management System
// Versão para navegador sem módulos ES6

// Verificar se Firebase e SweetAlert estão disponíveis
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK não carregado. Verifique os scripts incluídos no HTML.');
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Erro!',
            text: 'Falha ao carregar dependências. Verifique a conexão e tente novamente.',
            icon: 'error',
            customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
        });
    } else {
        alert('Erro: Firebase SDK não disponível.');
    }
    throw new Error('Firebase SDK não disponível');
}

if (typeof Swal === 'undefined') {
    console.warn('SweetAlert não carregado. Usando alert nativo como fallback.');
}

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

// Sistema de permissões
const PERMISSIONS = {
    admin: ["all"],
    director: ["view_all_schedules", "approve_schedules", "view_reports", "manage_settings"],
    subdirector: ["generate_schedules", "edit_schedules", "view_reports", "manage_teachers"],
    coordenador: ["generate_schedules_coordination", "edit_schedules_coordination", "manage_teachers_coordination", "send_notifications"],
    professor: ["view_own_schedule", "view_own_stats", "download_schedule"]
};

// Variáveis globais
let auth, db;

// Inicializar Firebase
function initializeFirebase() {
    if (firebase.apps.length === 0) {
        console.log('Inicializando Firebase...');
        firebase.initializeApp(firebaseConfig);
    } else {
        console.log('Firebase já inicializado');
    }
    auth = firebase.auth();
    db = firebase.firestore();
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => console.log('Persistência de sessão configurada'))
        .catch(error => console.error('Erro ao configurar persistência:', error));
}

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

// Função para garantir documentos do usuário
async function ensureUserDocuments(user) {
    const processingKey = `processing_${user.uid}`;
    if (sessionStorage.getItem(processingKey)) {
        console.log('Já processando documentos para este usuário, pulando...');
        return;
    }

    sessionStorage.setItem(processingKey, 'true');
    try {
        const userRef = db.collection('users').doc(user.uid);
        const professorRef = db.collection('professores').doc(user.uid);

        // Verificar documento users
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.log(`Criando documento users para ${user.uid}`);
            await userRef.set({
                role: 'professor', // Papel padrão
                coordenacao: '',
                ativo: true,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Verificar documento professores
        const professorDoc = await professorRef.get();
        if (!professorDoc.exists) {
            console.log(`Criando documento professores para ${user.uid}`);
            await professorRef.set({
                nome: user.displayName || user.email.split('@')[0] || 'Usuário',
                nomeNormalized: (user.displayName || user.email.split('@')[0] || 'usuário').toLowerCase(),
                email: user.email || '',
                emailNormalized: (user.email || '').toLowerCase(),
                contacto: '',
                formacaoMedio: '',
                habilitacoes: '',
                unidade: 'Instituto Politécnico Industrial do Kilamba Kiaxi Nº 8056 "Nova Vida"',
                categoria: '',
                classes: [],
                disciplinas: [],
                coordenacao: '',
                cargo: 'Professor',
                userId: user.uid,
                ativo: true,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        return professorDoc;
    } catch (error) {
        console.error('Erro ao garantir documentos do usuário:', error);
        throw new Error('Falha ao configurar dados do usuário.');
    } finally {
        sessionStorage.removeItem(processingKey);
    }
}

// Função para cachear perfil do usuário
function cacheUserProfile(user, professorDoc) {
    try {
        const profileData = {
            uid: user.uid,
            nome: professorDoc.exists && professorDoc.data().nome ? professorDoc.data().nome : user.displayName || user.email.split('@')[0] || 'Usuário',
            email: user.email || ''
        };
        sessionStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
        console.log(`Perfil do usuário ${user.uid} cacheado com sucesso`);
    } catch (error) {
        console.warn('Erro ao salvar perfil no sessionStorage:', error);
        if (error.name === 'QuotaExceededError') {
            console.warn('Limite de sessionStorage excedido. Limpando dados antigos.');
            sessionStorage.removeItem(`userProfile_${user.uid}`);
            try {
                sessionStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
            } catch (innerErr) {
                console.warn('Falha ao salvar após limpeza:', innerErr);
            }
        }
    }
}

// Função para atualizar saudação
function updateGreeting(profileData) {
    const greetingElements = document.querySelectorAll('.greeting, #greeting');
    if (greetingElements.length > 0 && profileData.nome) {
        greetingElements.forEach(el => {
            el.textContent = `Bem-vindo, ${profileData.nome}!`;
        });
        console.log(`Saudação atualizada: ${profileData.nome}`);
        return true;
    }
    console.warn('Elementos .greeting/#greeting não encontrados ou nome inválido');
    return false;
}

// Função para verificar permissões do usuário
async function checkUserPermission(permission) {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) return false;

        const userRole = userDoc.data().role;
        const userPermissions = PERMISSIONS[userRole] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
    }
}

// Função para redirecionar baseado no perfil
async function redirectBasedOnRole(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            console.log('Documento do usuário não encontrado, redirecionando para login');
            window.location.href = '/login';
            return;
        }

        const userRole = userDoc.data().role;
        const currentPath = window.location.pathname;

        const defaultPages = {
            admin: '/admin',
            director: '/director',
            subdirector: '/subdirector',
            coordenador: '/coordenador',
            professor: '/professor'
        };

        const publicPages = ['/login', '/signup.html', '/recover_pass.html', '/init-system.html', '/simple-init.html'];

        if (publicPages.includes(currentPath) || currentPath === '/' || currentPath.includes('login') || currentPath.endsWith('/')) {
            const targetPage = defaultPages[userRole] || '/professor';
            console.log(`Redirecionando usuário ${userRole} para ${targetPage}`);
            window.location.href = targetPage;
        }
    } catch (error) {
        console.error('Erro ao redirecionar baseado no perfil:', error);
    }
}

// Função para traduzir códigos de erro
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

// Função para gerenciar lockout
function startLockoutTimer(lockoutSeconds = 60) {
    const loginForm = document.getElementById('loginForm');
    const submitButton = document.querySelector('.submit');

    if (!loginForm) return;

    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    submitButton?.classList.remove('spinner-active');

    try {
        const lockoutEnd = Date.now() + lockoutSeconds * 1000;
        sessionStorage.setItem('lockoutEnd', lockoutEnd);

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
                try {
                    sessionStorage.removeItem('lockoutEnd');
                    sessionStorage.removeItem('loginAttempts');
                } catch (error) {
                    console.warn('Erro ao limpar sessionStorage:', error);
                }
                Swal.close();
            } else {
                setTimeout(updateTimer, 1000);
            }
        }

        updateTimer();
    } catch (error) {
        console.warn('Erro ao configurar lockout:', error);
    }
}

// Configurar formulário de login
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.log('Formulário de login não encontrado nesta página');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulário de login submetido');

        const lockoutEnd = sessionStorage.getItem('lockoutEnd');
        if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
            return;
        }

        const submitButton = document.querySelector('.submit');
        if (submitButton) {
            submitButton.classList.add('spinner-active');
            submitButton.disabled = true;
        }

        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();

        if (!email || !password) {
            if (submitButton) {
                submitButton.classList.remove('spinner-active');
                submitButton.disabled = false;
            }
            Swal.fire({
                title: 'Erro!',
                text: 'Preencha todos os campos de login.',
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
            return;
        }

        let attempts = parseInt(sessionStorage.getItem('loginAttempts') || '0');
        attempts += 1;
        try {
            sessionStorage.setItem('loginAttempts', attempts);
        } catch (error) {
            console.warn('Erro ao gerenciar loginAttempts:', error);
        }

        try {
            const userCredential = await withRetry(() => auth.signInWithEmailAndPassword(email, password));
            const user = userCredential.user;
            console.log('Usuário logado:', user.email);

            const professorDoc = await ensureUserDocuments(user);
            cacheUserProfile(user, professorDoc);
            try {
                sessionStorage.setItem('currentUserId', user.uid);
                sessionStorage.removeItem('loginAttempts');
            } catch (error) {
                console.warn('Erro ao gerenciar sessionStorage:', error);
            }

            await redirectBasedOnRole(user);
        } catch (error) {
            if (submitButton) {
                submitButton.classList.remove('spinner-active');
                submitButton.disabled = false;
            }

            console.error('Erro no login:', error);
            if (attempts >= 3 || error.code === 'auth/too-many-requests') {
                Swal.fire({
                    title: 'Erro!',
                    text: 'Muitas tentativas de login. Aguarde antes de tentar novamente.',
                    icon: 'error',
                    customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
                });
                startLockoutTimer();
                return;
            }

            Swal.fire({
                title: 'Erro!',
                text: getFriendlyErrorMessage(error.code),
                icon: 'error',
                customClass: { popup: 'my-swal-popup', title: 'my-swal-title', content: 'my-swal-text', confirmButton: 'my-swal-button' }
            });
        }
    });
}

// Configurar listener de autenticação
function setupAuthStateListener() {
    auth.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                console.log('Usuário autenticado:', user.uid);

                const cachedUserId = sessionStorage.getItem('currentUserId');
                if (cachedUserId === user.uid) {
                    try {
                        const cachedProfile = sessionStorage.getItem(`userProfile_${user.uid}`);
                        if (cachedProfile) {
                            const profileData = JSON.parse(cachedProfile);
                            if (updateGreeting(profileData)) {
                                return;
                            }
                        }
                    } catch (error) {
                        console.warn('Erro ao recuperar perfil do sessionStorage:', error);
                    }
                }

                const professorDoc = await withRetry(() => db.collection('professores').doc(user.uid).get());
                const profileData = {
                    nome: professorDoc.exists && professorDoc.data().nome ? professorDoc.data().nome : user.displayName || user.email.split('@')[0] || 'Usuário',
                    email: user.email || ''
                };
                if (updateGreeting(profileData)) {
                    cacheUserProfile(user, professorDoc);
                }

                try {
                    sessionStorage.setItem('currentUserId', user.uid);
                } catch (error) {
                    console.warn('Erro ao salvar currentUserId:', error);
                }

                await redirectBasedOnRole(user);
            } else {
                console.log('Nenhum usuário autenticado');
                try {
                    sessionStorage.clear();
                } catch (error) {
                    console.warn('Erro ao limpar sessionStorage:', error);
                }

                const publicPages = ['/login', '/signup.html', '/recover_pass.html', '/init-system.html', '/simple-init.html'];
                const currentPath = window.location.pathname;
                if (!publicPages.includes(currentPath) && currentPath !== '/' && !currentPath.endsWith('/')) {
                    console.log('Redirecionando para login');
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
                    try {
                        sessionStorage.clear();
                    } catch (clearError) {
                        console.warn('Erro ao limpar sessionStorage:', clearError);
                    }
                    window.location.href = '/login';
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
}

// Função de logout
async function handleLogout() {
    try {
        await auth.signOut();
        console.log('Usuário deslogado');
        try {
            sessionStorage.clear();
        } catch (error) {
            console.warn('Erro ao limpar sessionStorage:', error);
        }
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
}

// Inicializar tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando sistema...');
    initializeFirebase();
    setupLoginForm();
    setupAuthStateListener();
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    const lockoutEnd = sessionStorage.getItem('lockoutEnd');
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        startLockoutTimer((parseInt(lockoutEnd) - Date.now()) / 1000);
    }

    // Exportar funções para uso global
    window.checkUserPermission = checkUserPermission;
    window.handleLogout = handleLogout;
    window.ensureUserDocuments = ensureUserDocuments;
    window.updateGreeting = updateGreeting;
});

console.log('Script de autenticação carregado com sucesso');