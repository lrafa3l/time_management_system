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

// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();

// console.log('Firebase inicializado:', firebase.app().name);

// // Carregar calendário após autenticação
// auth.onAuthStateChanged((user) => {
//   console.log('Estado de autenticação:', user ? user.uid : 'Não autenticado');
//   if (!user) {
//     console.log('Redirecionando para /index.html');
//     window.location.href = '/index.html';
//     return;
//   }

//   const calendarEl = document.getElementById('calendar');
//   if (!calendarEl) {
//     console.error('Elemento #calendar não encontrado');
//     return;
//   }
//   console.log('Elemento #calendar encontrado:', calendarEl);

//   try {
//     const calendar = new FullCalendar.Calendar(calendarEl, {
//       initialView: 'dayGridMonth',
//       initialDate: '2025-05-22',
//       headerToolbar: {
//         left: 'prev,next today',
//         center: 'title',
//         right: 'dayGridMonth,timeGridWeek,timeGridDay'
//       },
//       locale: 'pt',
//       events: async (fetchInfo, successCallback, failureCallback) => {
//         try {
//           console.log('Buscando eventos para userId:', user.uid);
//           const snapshot = await db.collection('events')
//             .where('userId', '==', user.uid)
//             .get();
//           const events = snapshot.docs.map(doc => {
//             console.log('Evento encontrado:', doc.id, doc.data());
//             return {
//               id: doc.id,
//               title: doc.data().title,
//               start: doc.data().start,
//               end: doc.data().end,
//               allDay: doc.data().allDay
//             };
//           });
//           console.log('Eventos carregados:', events);
//           successCallback(events);
//         } catch (error) {
//           console.error('Erro ao carregar eventos:', error);
//           failureCallback(error);
//         }
//       }
//     });
//     console.log('Iniciando renderização do calendário');
//     calendar.render();
//   } catch (error) {
//     console.error('Erro ao inicializar FullCalendar:', error);
//   }
// });