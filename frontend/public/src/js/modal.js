// document.addEventListener("DOMContentLoaded", function () {
//   // Configuração do Firebase
//   const firebaseConfig = {
//     apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
//     authDomain: "schedule-system-8c4b6.firebaseapp.com",
//     databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
//     projectId: "schedule-system-8c4b6",
//     storageBucket: "schedule-system-8c4b6.firebasestorage.app",
//     messagingSenderId: "1056197912318",
//     appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
//     measurementId: "G-GHEY7QZEQ9"
// };

//   // Inicializa o Firebase se ainda não estiver inicializado
//   if (!firebase.apps.length) {
//     firebase.initializeApp(firebaseConfig);
//   }

//   const db = firebase.firestore();
  
//   const modal = document.getElementById("formModal");
//   const modalBody = document.querySelector(".modal-body");
//   const modalTitle = document.getElementById("modalTitle");

//   // Fechar modal
//   document.querySelector(".close-modal").addEventListener("click", closeModal);

//   // Abrir modal com o formulário correto
//   document.querySelectorAll(".modal-trigger").forEach((link) => {
//     link.addEventListener("click", function (e) {
//       e.preventDefault();
//       const formType = this.getAttribute("data-form");
//       loadForm(formType);
//       openModal();
//     });
//   });

//   function openModal() {
//     document.body.classList.add("modal-open");
//     modal.style.display = "flex";
//     modal.querySelector("input")?.focus();
//   }

//   function closeModal() {
//     document.body.classList.remove("modal-open");
//     modal.style.display = "none";
//   }

//   async function loadForm(formType) {
//     modalTitle.textContent = `Cadastro de ${
//       formType.charAt(0).toUpperCase() + formType.slice(1)
//     }`;

//     let formHTML = "";
//     let messageHTML = '<p id="mensagem"></p>';

//     switch (formType) {
//       case "curso":
//         formHTML = `
//           <form id="cadastro-curso">
//             <div class="form-group">
//               <label for="nome">Curso</label>
//               <input type="text" id="nome" name="nome" required>
//             </div>
//             <button type="submit">Cadastrar</button>
//           </form>`;
//         break;

//       case "sala":
//         formHTML = `
//           <form id="cadastro-sala">
//             <div class="form-group">
//               <label for="nome">Sala</label>
//               <input type="text" id="nome" name="nome" required>
//             </div>
//             <div class="form-group">
//               <label for="capacidade">Capacidade</label>
//               <input type="number" id="capacidade" min=1 name="capacidade" required>
//             </div>
//             <button type="submit">Cadastrar</button>
//           </form>`;
//         break;

//       case "turma":
//         // Carrega cursos para o dropdown
//         const cursos = await loadCursos();
//         let options = '<option value="">Selecione um curso</option>';
//         cursos.forEach(curso => {
//           options += `<option value="${curso.id}">${curso.nome}</option>`;
//         });

//         formHTML = `
//           <form id="cadastro-turma">
//             <div class="form-group">
//               <label for="nome">Turma</label>
//               <input type="text" id="nome" name="nome" required>
//             </div>
//             <div class="form-group">
//               <label for="curso">Curso</label>
//               <select id="curso" name="curso" required>
//                 ${options}
//               </select>
//             </div>
//             <button type="submit">Cadastrar</button>
//           </form>`;
//         break;

//       case "professor":
//         formHTML = `
//           <form id="cadastro-professor">
//             <div class="form-group">
//               <label for="nome">Nome Completo</label>
//               <input type="text" id="nome" name="nome" required>
//             </div>
            
            // <div class="form-group">
            //   <label for="unidade">Unidade Orgânica</label>
            //   <input type="text" id="unidade" name="unidade" required>
            // </div>
            
            // <div class="form-group">
            //   <label for="categoria">Categoria</label>
            //   <select id="categoria" name="categoria" required>
            //     <option value="">Selecione...</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 1.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 2.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 3.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 4.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 5.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 6.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 7.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 8.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 9.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 10.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 11.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 12.º Grau</option>
            //     <option value="professor">Prof. Do Ens. Prim. E Sec. Do 13.º Grau</option>
            //     <option value="outra">Outra</option>
            //   </select>
            // </div>
            
            // <div class="form-group">
            //   <label for="classe">Classe que Leciona</label>
            //   <input type="text" id="classe" name="classe" required>
            //   <small>Separe múltiplas classes por barra (/)</small>
            // </div>
            
            // <div class="form-group">
            //   <label for="disciplinas">Disciplina(s)</label>
            //   <input type="text" id="disciplinas" name="disciplinas" required>
            //   <small>Separe múltiplas disciplinas por barra (/)</small>
            // </div>
            
            // <div class="form-group">
            //   <label for="formacao-medio">Formação do Ensino Médio</label>
            //   <input type="text" id="formacao-medio" name="formacao-medio" required>
            // </div>
            
            // <div class="form-group">
            //   <label for="habilitacoes">Habilitações Literár. Ensino Superior</label>
            //   <input type="text" id="habilitacoes" name="habilitacoes" required>
            // </div>
            
            // <div class="form-group">
            //   <label for="cargo">Cargo / Função</label>
            //   <input type="text" id="cargo" name="cargo" required>
            // </div>
            
            // <div class="form-group">
            //   <label for="contacto">Contacto Telefónico</label>
            //   <input type="tel" id="contacto" name="contacto" required>
            // </div>
            
            // <div class="form-group">
            //   <label for="email">E-mail</label>
            //   <input type="email" id="email" name="email" required>
            // </div>
            
//             <button type="submit">Cadastrar</button>
//           </form>`;
//         break;

//       case "disciplina":
//         formHTML = `
//           <form id="cadastro-disciplina">
//             <div class="form-group">
//               <label for="nome">Disciplina</label>
//               <input type="text" id="nome" name="nome" required>
//             </div>
//             <button type="submit">Cadastrar</button>
//           </form>`;
//         break;
//     }

//     modalBody.innerHTML = formHTML + messageHTML;
//     const formId = `cadastro-${formType}`;
//     document.getElementById(formId)?.addEventListener("submit", function (e) {
//       e.preventDefault();
//       handleFormSubmit(formType, this);
//     });
//   }

//   async function handleFormSubmit(formType, form) {
//     const formData = new FormData(form);
//     const data = Object.fromEntries(formData.entries());
//     const message = document.getElementById("mensagem");

//     try {
//       // Adiciona timestamp
//       data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      
//       let docRef;
      
//       switch(formType) {
//         case "curso":
//           docRef = await db.collection("cursos").add({
//             nome: data.nome,
//             createdAt: data.createdAt
//           });
//           break;
          
//         case "sala":
//           docRef = await db.collection("salas").add({
//             nome: data.nome,
//             capacidade: parseInt(data.capacidade),
//             createdAt: data.createdAt
//           });
//           break;
          
//         case "turma":
//           docRef = await db.collection("turmas").add({
//             nome: data.nome,
//             cursoId: data.curso,
//             createdAt: data.createdAt
//           });
//           break;
          
//         case "professor":
//           docRef = await db.collection("professores").add({
//             nome: data.nome,
//             unidade: data.unidade,
//             categoria: data.categoria,
//             classe: data.classe,
//             disciplinas: data.disciplinas,
//             formacaoMedio: data["formacao-medio"],
//             habilitacoesSuperior: data.habilitacoes,
//             cargo: data.cargo,
//             contacto: data.contacto,
//             email: data.email,
//             createdAt: data.createdAt
//           });
//           break;
          
//         case "disciplina":
//           docRef = await db.collection("disciplinas").add({
//             nome: data.nome,
//             createdAt: data.createdAt
//           });
//           break;
//       }

//       showMessage(message, `${formType} cadastrado com sucesso!`, 'success');
//       form.reset();
      
//       // Fecha o modal após 2 segundos
//       setTimeout(closeModal, 2000);
      
//     } catch (error) {
//       console.error("Erro ao cadastrar:", error);
//       showMessage(message, "Erro ao cadastrar. Tente novamente.", 'error');
//     }
//   }

//   // Função auxiliar para carregar cursos (usado no cadastro de turmas)
//   async function loadCursos() {
//     try {
//       const snapshot = await db.collection("cursos").get();
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         nome: doc.data().nome
//       }));
//     } catch (error) {
//       console.error("Erro ao carregar cursos:", error);
//       return [];
//     }
//   }

//   // Função auxiliar para mostrar mensagens
//   function showMessage(element, text, type) {
//     element.textContent = text;
//     element.className = type; // 'success' ou 'error'
//   }

//   // Fechar modal com ESC
//   document.addEventListener("keydown", function (e) {
//     if (e.key === "Escape" && modal.style.display === "flex") {
//       closeModal();
//     }
//   });
// });