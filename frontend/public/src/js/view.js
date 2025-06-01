// Import Firebase and Swal
import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/auth"
import Swal from "sweetalert2"
import html2pdf from "html2pdf.js"

// Script para gerenciar a visualização, edição e download do horário do professor
document.addEventListener("DOMContentLoaded", () => {
  // Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
    authDomain: "schedule-system-8c4b6.firebaseapp.com",
    databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
    projectId: "schedule-system-8c4b6",
    storageBucket: "schedule-system-8c4b6.firebasestorage.app",
    messagingSenderId: "1056197912318",
    appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
    measurementId: "G-GHEY7QZEQ9",
  }

  // Inicializar Firebase
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig)
    } catch (error) {
      console.error("Erro na inicialização do Firebase:", error)
      return
    }
  }
  const db = firebase.firestore()
  const auth = firebase.auth()

  // Elementos da UI
  const editBtn = document.getElementById("editBtn")
  const saveBtn = document.getElementById("saveBtn")
  const cancelBtn = document.getElementById("cancelBtn")
  const downloadBtn = document.getElementById("downloadBtn")
  const editableElements = document.querySelectorAll('[contenteditable="true"]')

  // Armazenar dados originais para cancelamento
  let originalData = {}

  // Obter ID do professor da URL
  const urlParams = new URLSearchParams(window.location.search)
  const professorId = urlParams.get("professorId")

  if (!professorId) {
    console.error("Nenhum professorId fornecido na URL")
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Professor não especificado!",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "/main.html"
    })
    return
  }

  // Verificar permissões do usuário
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.error("Usuário não autenticado")
      window.location.href = "/index.html"
      return
    }

    // Verificar se o usuário tem permissão para editar este horário
    const isOwner = user.uid === professorId
    const userDoc = await db.collection("users").doc(user.uid).get()
    const userRole = userDoc.exists ? userDoc.data().role : "professor"

    const canEdit = isOwner || ["admin", "director", "subdirector"].includes(userRole)

    if (!canEdit) {
      editBtn.style.display = "none"
    }

    // Carregar horário
    loadSchedule()
  })

  // Funções auxiliares
  async function getDisciplinaNames(disciplinaIds) {
    if (!disciplinaIds || disciplinaIds.length === 0) {
      return ""
    }
    try {
      const disciplinas = await Promise.all(
        disciplinaIds.map(async (id) => {
          const doc = await db.collection("disciplinas").doc(id).get()
          return doc.exists ? doc.data().nome || "" : ""
        }),
      )
      return disciplinas.filter((name) => name).join(", ")
    } catch (error) {
      console.error("Erro ao carregar nomes das disciplinas:", error)
      return ""
    }
  }

  // Carregar horário e dados do professor
  async function loadSchedule() {
    try {
      console.log("Carregando dados para professorId:", professorId)

      // Buscar dados do professor
      const professorDoc = await db.collection("professores").doc(professorId).get()
      if (!professorDoc.exists) {
        throw new Error("Professor não encontrado")
      }

      const professorData = professorDoc.data()

      // Preencher dados do professor
      document.getElementById("nome").textContent = professorData.nome || "N/A"
      document.getElementById("unidade_organica").textContent = professorData.unidade || "N/A"
      document.getElementById("categoria").textContent = professorData.categoria || "N/A"
      document.getElementById("classe_leciona").textContent = professorData.classes?.join(", ") || "N/A"
      document.getElementById("disciplinas").textContent = await getDisciplinaNames(professorData.disciplinas || [])
      document.getElementById("formacao_medio").textContent = professorData.formacaoMedio || "N/A"
      document.getElementById("habilitacoes_superior").textContent = professorData.habilitacoes || "N/A"
      document.getElementById("cargo_funcao").textContent = professorData.cargo || "N/A"
      document.getElementById("contacto_telefonico").textContent = professorData.contacto || "N/A"
      document.getElementById("professor_assinatura").textContent = professorData.nome || "N/A"

      // Buscar entradas de horário
      const scheduleSnapshot = await db.collection("horarios").where("professorId", "==", professorId).get()

      if (scheduleSnapshot.empty) {
        console.warn("Nenhum horário encontrado para este professor")
        return
      }

      // Carregar mapas de turmas, salas e disciplinas
      const [turmasMap, salasMap, disciplinasMap] = await Promise.all([
        loadCollection("turmas"),
        loadCollection("salas"),
        loadCollection("disciplinas"),
      ])

      // Inicializar objeto de horário
      const schedule = {
        seg: {},
        ter: {},
        qua: {},
        qui: {},
        sex: {},
      }
      let totalTemposLectivos = 0

      // Preencher horário
      scheduleSnapshot.forEach((doc) => {
        const data = doc.data()
        const day = data.day.toLowerCase().substring(0, 3) // e.g., 'Segunda' -> 'seg'
        const time = data.timeSlot

        schedule[day][time] = {
          period: data.period,
          session: data.session,
          turma: turmasMap.get(data.turmaId) || "N/A",
          sala: salasMap.get(data.salaId) || "N/A",
          disciplina: disciplinasMap.get(data.disciplinaId) || "N/A",
          docId: doc.id,
        }

        totalTemposLectivos++
      })

      // Preencher tabela
      const times = [
        "7H00-7H50",
        "7H55-8H45",
        "8H50-9H40",
        "10H00-10H50",
        "10H55-11H45",
        "11H50-12H40",
        "13H00-13H50",
        "13H55-14H45",
        "14H50-15H40",
        "16H00-16H50",
        "16H55-17H45",
      ]

      times.forEach((time, index) => {
        const period = index < 6 ? index + 1 + "º" : index - 5 + "º"
        const session = index < 6 ? "manha" : "tarde"
        ;["seg", "ter", "qua", "qui", "sex"].forEach((day) => {
          const aulaId = `${day}-${session}-${period}-aula`
          const salaId = `${day}-${session}-${period}-sala`

          const elementAula = document.getElementById(aulaId)
          const elementSala = document.getElementById(salaId)

          if (!elementAula || !elementSala) {
            console.error(`Elementos não encontrados: ${aulaId}, ${salaId}`)
            return
          }

          const entry = schedule[day][time]

          if (entry && entry.turma && entry.disciplina) {
            elementAula.textContent = `${entry.turma} (${entry.disciplina})`
            elementSala.textContent = entry.sala
          } else {
            elementAula.textContent = ""
            elementSala.textContent = ""
          }
        })
      })

      // Preencher total de tempos
      document.getElementById("total_tempos").textContent = `TOTAL DE TEMPOS LECTIVOS: ${totalTemposLectivos}`

      // Desabilitar edição inicialmente
      disableEditing()
    } catch (error) {
      console.error("Erro ao carregar horário:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: `Erro ao carregar horário: ${error.message}`,
        confirmButtonText: "OK",
      })
    }
  }

  // Carregar coleção e retornar mapa de ID para nome
  async function loadCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get()
    const map = new Map()

    snapshot.forEach((doc) => {
      map.set(doc.id, doc.data().nome || "N/A")
    })

    return map
  }

  // Habilitar edição
  function enableEditing() {
    // Salvar dados originais para possível cancelamento
    editableElements.forEach((el) => {
      originalData[el.id] = el.textContent
      el.setAttribute("contenteditable", "true")
      el.classList.add("editable")
    })

    // Mostrar botões de salvar e cancelar
    editBtn.style.display = "none"
    saveBtn.style.display = "inline-block"
    cancelBtn.style.display = "inline-block"
  }

  // Desabilitar edição
  function disableEditing() {
    editableElements.forEach((el) => {
      el.setAttribute("contenteditable", "false")
      el.classList.remove("editable")
    })

    // Mostrar apenas botão de editar
    editBtn.style.display = "inline-block"
    saveBtn.style.display = "none"
    cancelBtn.style.display = "none"
  }

  // Salvar alterações
  async function saveChanges() {
    try {
      const user = firebase.auth().currentUser
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Mostrar indicador de carregamento
      Swal.fire({
        title: "Salvando alterações...",
        text: "Por favor, aguarde.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Atualizar dados do professor
      await db
        .collection("professores")
        .doc(professorId)
        .update({
          nome: document.getElementById("nome").textContent,
          unidade: document.getElementById("unidade_organica").textContent,
          categoria: document.getElementById("categoria").textContent,
          formacaoMedio: document.getElementById("formacao_medio").textContent,
          habilitacoes: document.getElementById("habilitacoes_superior").textContent,
          cargo: document.getElementById("cargo_funcao").textContent,
          contacto: document.getElementById("contacto_telefonico").textContent,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

      // Recarregar horário para refletir alterações
      await loadSchedule()

      // Desabilitar edição
      disableEditing()

      // Mostrar mensagem de sucesso
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Alterações salvas com sucesso.",
        confirmButtonText: "OK",
      })
    } catch (error) {
      console.error("Erro ao salvar alterações:", error)
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: `Erro ao salvar alterações: ${error.message}`,
        confirmButtonText: "OK",
      })
    }
  }

  // Cancelar alterações
  function cancelChanges() {
    // Restaurar dados originais
    Object.keys(originalData).forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        element.textContent = originalData[id]
      }
    })

    // Limpar dados originais
    originalData = {}

    // Desabilitar edição
    disableEditing()

    // Mostrar mensagem
    Swal.fire({
      icon: "info",
      title: "Alterações canceladas",
      text: "As alterações foram descartadas.",
      confirmButtonText: "OK",
      timer: 2000,
      timerProgressBar: true,
    })
  }

  // Gerar e baixar PDF
  function downloadPDF() {
    // Configurar opções do PDF
    const element = document.querySelector(".container")
    const opt = {
      margin: [10, 10],
      filename: `Horário_${document.getElementById("nome").textContent.trim()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }

    // Mostrar indicador de carregamento
    Swal.fire({
      title: "Gerando PDF...",
      text: "Por favor, aguarde.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()

        // Gerar PDF
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "PDF gerado com sucesso!",
              text: "O download começará automaticamente.",
              confirmButtonText: "OK",
              timer: 3000,
              timerProgressBar: true,
            })
          })
          .catch((error) => {
            console.error("Erro ao gerar PDF:", error)
            Swal.fire({
              icon: "error",
              title: "Erro",
              text: "Erro ao gerar PDF. Tente novamente.",
              confirmButtonText: "OK",
            })
          })
      },
    })
  }

  // Event Listeners
  if (editBtn) {
    editBtn.addEventListener("click", enableEditing)
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveChanges)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelChanges)
  }

  // Adicionar botão de download se não existir
  if (!document.getElementById("downloadBtn")) {
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      const downloadBtn = document.createElement("button")
      downloadBtn.id = "downloadBtn"
      downloadBtn.className = "btn"
      downloadBtn.textContent = "Baixar PDF"
      downloadBtn.addEventListener("click", downloadPDF)
      actionButtons.appendChild(downloadBtn)
    }
  } else {
    document.getElementById("downloadBtn").addEventListener("click", downloadPDF)
  }
})
