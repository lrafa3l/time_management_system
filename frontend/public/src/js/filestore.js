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

// // Inicialize o Firebase
// if (!firebase.apps.length) {
//     firebase.initializeApp(firebaseConfig);
// }

// const db = firebase.firestore();

// // Função para carregar os dados do usuário
// async function loadUserData() {
//     const user = firebase.auth().currentUser;
    
//     if (user) {
//         try {
//             const doc = await db.collection('users').doc(user.uid).get();
            
//             if (doc.exists) {
//                 const userData = doc.data();
//                 displayUserData(userData);
//             } else {
//                 console.log("Nenhum documento encontrado para este usuário!");
//             }
//         } catch (error) {
//             console.error("Erro ao carregar dados do usuário:", error);
//         }
//     } else {
//         console.log("Usuário não autenticado");
//     }
// }

// // Função para exibir os dados na página
// function displayUserData(userData) {
//     const dashboardContainer = document.querySelector('.dashboard-container');
    
//     // Crie o HTML para exibir os dados do usuário
//     dashboardContainer.innerHTML = `
//         <div class="profile-card">
//             <div class="profile-header">
//                 <div class="profile-avatar">
//                     <i class="fas fa-user-circle"></i>
//                 </div>
//                 <h2>${userData.name || 'Nome não informado'}</h2>
//                 <p>${userData.email || 'Email não informado'}</p>
//             </div>
            
//             <div class="profile-details">
//                 <div class="detail-item">
//                     <span class="detail-label">Telefone:</span>
//                     <span class="detail-value">${userData.phone || 'Não informado'}</span>
//                 </div>
//                 <div class="detail-item">
//                     <span class="detail-label">Cargo:</span>
//                     <span class="detail-value">${userData.role || 'Não informado'}</span>
//                 </div>
//                 <div class="detail-item">
//                     <span class="detail-label">Data de Registro:</span>
//                     <span class="detail-value">${userData.registrationDate || 'Não informado'}</span>
//                 </div>
//             </div>
            
//             <button id="edit-profile-btn" class="btn-primary">
//                 <i class="fas fa-edit"></i> Editar Perfil
//             </button>
//         </div>
//     `;
    
//     // Adicione evento ao botão de edição se necessário
//     document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
//         // Lógica para editar o perfil
//     });
// }

// // Carregue os dados quando a página estiver pronta
// document.addEventListener('DOMContentLoaded', () => {
//     // Verifique se o usuário está autenticado antes de carregar os dados
//     firebase.auth().onAuthStateChanged((user) => {
//         if (user) {
//             loadUserData();
//         } else {
//             // Redirecione para a página de login se não estiver autenticado
//             window.location.href = '/login';
//         }
//     });
// });