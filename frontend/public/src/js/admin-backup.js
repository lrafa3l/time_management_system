document.addEventListener("DOMContentLoaded", () => {
  const firebase = window.firebase // Declare firebase variable
  const Swal = window.Swal // Declare Swal variable

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

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  const db = firebase.firestore()
  const auth = firebase.auth()
  const storage = firebase.storage()

  // Verificar se é admin
  async function checkAdminAccess() {
    const user = auth.currentUser
    if (!user) {
      window.location.href = "/index.html"
      return false
    }

    try {
      const userDoc = await db.collection("users").doc(user.uid).get()
      if (!userDoc.exists || userDoc.data().role !== "admin") {
        Swal.fire({
          title: "Acesso Negado",
          text: "Apenas administradores podem acessar esta página.",
          icon: "error",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = "/main.html"
        })
        return false
      }
      return true
    } catch (error) {
      console.error("Erro ao verificar permissões:", error)
      return false
    }
  }

  // Criar backup
  async function createBackup() {
    const backupType = document.getElementById("backup-type").value
    const description = document.getElementById("backup-description").value

    try {
      showProgressModal("Criando Backup...", "Coletando dados do sistema...")
      updateProgress(10)

      const backupData = {
        metadata: {
          type: backupType,
          description: description || "Backup manual",
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.uid,
          version: "1.0",
        },
        data: {},
      }

      // Coletar dados baseado no tipo
      if (backupType === "full" || backupType === "users") {
        updateProgress(25, "Coletando dados de usuários...")
        const usersSnapshot = await db.collection("users").get()
        backupData.data.users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      }

      if (backupType === "full" || backupType === "teachers") {
        updateProgress(40, "Coletando dados de professores...")
        const teachersSnapshot = await db.collection("professores").get()
        backupData.data.teachers = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      }

      if (backupType === "full" || backupType === "schedules") {
        updateProgress(60, "Coletando horários...")
        const schedulesSnapshot = await db.collection("horarios").get()
        backupData.data.schedules = schedulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      }

      if (backupType === "full") {
        updateProgress(75, "Coletando configurações...")
        const settingsSnapshot = await db.collection("system").get()
        backupData.data.settings = settingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      }

      updateProgress(85, "Preparando arquivo de backup...")

      // Criar arquivo JSON
      const backupJson = JSON.stringify(backupData, null, 2)
      const blob = new Blob([backupJson], { type: "application/json" })

      // Upload para Firebase Storage
      updateProgress(90, "Salvando backup...")
      const fileName = `backup_${backupType}_${Date.now()}.json`
      const storageRef = storage.ref().child(`backups/${fileName}`)

      await storageRef.put(blob)
      const downloadURL = await storageRef.getDownloadURL()

      // Salvar metadata no Firestore
      await db
        .collection("system")
        .doc("backups")
        .collection("history")
        .add({
          fileName: fileName,
          type: backupType,
          description: description || "Backup manual",
          size: blob.size,
          downloadURL: downloadURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: auth.currentUser.uid,
          status: "completed",
        })

      updateProgress(100, "Backup concluído!")

      setTimeout(() => {
        hideProgressModal()
        Swal.fire({
          title: "Sucesso!",
          text: "Backup criado com sucesso.",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Download",
          cancelButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            downloadBackup(downloadURL, fileName)
          }
        })

        loadBackupHistory()
        updateStats()
      }, 1000)
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      hideProgressModal()
      Swal.fire({
        title: "Erro",
        text: "Erro ao criar backup. Tente novamente.",
        icon: "error",
      })
    }
  }

  // Download backup
  function downloadBackup(url, fileName) {
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Restaurar backup
  async function restoreBackup() {
    const fileInput = document.getElementById("restore-file")
    const confirmCheckbox = document.getElementById("confirm-restore")

    if (!fileInput.files[0]) {
      Swal.fire({
        title: "Erro",
        text: "Selecione um arquivo de backup.",
        icon: "error",
      })
      return
    }

    if (!confirmCheckbox.checked) {
      Swal.fire({
        title: "Erro",
        text: "Confirme que entende que esta ação substituirá os dados atuais.",
        icon: "error",
      })
      return
    }

    const file = fileInput.files[0]

    try {
      showProgressModal("Restaurando Backup...", "Lendo arquivo de backup...")
      updateProgress(10)

      const fileContent = await readFileAsText(file)
      const backupData = JSON.parse(fileContent)

      // Validar estrutura do backup
      if (!backupData.metadata || !backupData.data) {
        throw new Error("Arquivo de backup inválido")
      }

      updateProgress(25, "Validando dados...")

      // Confirmar restauração
      const result = await Swal.fire({
        title: "Confirmar Restauração",
        html: `
                    <p>Tipo: ${backupData.metadata.type}</p>
                    <p>Data: ${new Date(backupData.metadata.createdAt).toLocaleString("pt-BR")}</p>
                    <p>Descrição: ${backupData.metadata.description}</p>
                    <br>
                    <strong class="text-red-600">Esta ação não pode ser desfeita!</strong>
                `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, restaurar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      })

      if (!result.isConfirmed) {
        hideProgressModal()
        return
      }

      // Restaurar dados
      if (backupData.data.users) {
        updateProgress(40, "Restaurando usuários...")
        const batch = db.batch()
        backupData.data.users.forEach((user) => {
          const userRef = db.collection("users").doc(user.id)
          batch.set(userRef, user)
        })
        await batch.commit()
      }

      if (backupData.data.teachers) {
        updateProgress(60, "Restaurando professores...")
        const batch = db.batch()
        backupData.data.teachers.forEach((teacher) => {
          const teacherRef = db.collection("professores").doc(teacher.id)
          batch.set(teacherRef, teacher)
        })
        await batch.commit()
      }

      if (backupData.data.schedules) {
        updateProgress(80, "Restaurando horários...")
        const batch = db.batch()
        backupData.data.schedules.forEach((schedule) => {
          const scheduleRef = db.collection("horarios").doc(schedule.id)
          batch.set(scheduleRef, schedule)
        })
        await batch.commit()
      }

      if (backupData.data.settings) {
        updateProgress(90, "Restaurando configurações...")
        const batch = db.batch()
        backupData.data.settings.forEach((setting) => {
          const settingRef = db.collection("system").doc(setting.id)
          batch.set(settingRef, setting)
        })
        await batch.commit()
      }

      // Log da restauração
      await db
        .collection("system")
        .doc("activity_logs")
        .collection("logs")
        .add({
          action: "backup_restored",
          user: auth.currentUser.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          details: `Backup restaurado: ${backupData.metadata.description}`,
          backupType: backupData.metadata.type,
        })

      updateProgress(100, "Restauração concluída!")

      setTimeout(() => {
        hideProgressModal()
        Swal.fire({
          title: "Sucesso!",
          text: "Backup restaurado com sucesso.",
          icon: "success",
        }).then(() => {
          window.location.reload()
        })
      }, 1000)
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      hideProgressModal()
      Swal.fire({
        title: "Erro",
        text: "Erro ao restaurar backup. Verifique o arquivo.",
        icon: "error",
      })
    }
  }

  // Ler arquivo como texto
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  // Carregar histórico de backups
  async function loadBackupHistory() {
    try {
      const backupsSnapshot = await db
        .collection("system")
        .doc("backups")
        .collection("history")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get()

      const historyContainer = document.getElementById("backup-history")
      historyContainer.innerHTML = ""

      if (backupsSnapshot.empty) {
        historyContainer.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                            <i class="fas fa-database text-4xl mb-4"></i>
                            <p>Nenhum backup encontrado</p>
                        </td>
                    </tr>
                `
        return
      }

      backupsSnapshot.docs.forEach((doc) => {
        const backup = doc.data()
        const row = createBackupRow(doc.id, backup)
        historyContainer.appendChild(row)
      })
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    }
  }

  // Criar linha da tabela de backup
  function createBackupRow(id, backup) {
    const row = document.createElement("tr")
    row.className = "hover:bg-gray-50"

    const createdAt = backup.createdAt ? backup.createdAt.toDate().toLocaleString("pt-BR") : "Data não disponível"
    const size = formatFileSize(backup.size || 0)

    const typeColors = {
      full: "bg-blue-100 text-blue-800",
      users: "bg-green-100 text-green-800",
      schedules: "bg-purple-100 text-purple-800",
      teachers: "bg-yellow-100 text-yellow-800",
    }

    const typeNames = {
      full: "Completo",
      users: "Usuários",
      schedules: "Horários",
      teachers: "Professores",
    }

    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${createdAt}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[backup.type] || "bg-gray-100 text-gray-800"}">
                    ${typeNames[backup.type] || backup.type}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${backup.description || "Sem descrição"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${size}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${backup.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                    ${backup.status === "completed" ? "Concluído" : "Erro"}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="downloadBackup('${backup.downloadURL}', '${backup.fileName}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="deleteBackup('${id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `

    return row
  }

  // Deletar backup
  window.deleteBackup = async (backupId) => {
    const result = await Swal.fire({
      title: "Deletar Backup",
      text: "Esta ação não pode ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, deletar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    })

    if (result.isConfirmed) {
      try {
        await db.collection("system").doc("backups").collection("history").doc(backupId).delete()

        Swal.fire({
          title: "Sucesso!",
          text: "Backup deletado com sucesso.",
          icon: "success",
        })

        loadBackupHistory()
        updateStats()
      } catch (error) {
        console.error("Erro ao deletar backup:", error)
        Swal.fire({
          title: "Erro",
          text: "Erro ao deletar backup.",
          icon: "error",
        })
      }
    }
  }

  // Atualizar estatísticas
  async function updateStats() {
    try {
      const backupsSnapshot = await db.collection("system").doc("backups").collection("history").get()

      let totalSize = 0
      let lastBackup = "Nunca"

      if (!backupsSnapshot.empty) {
        const backups = backupsSnapshot.docs.map((doc) => doc.data())

        totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0)

        const sortedBackups = backups.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0)
          const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0)
          return dateB - dateA
        })

        if (sortedBackups.length > 0) {
          const lastBackupDate = sortedBackups[0].createdAt ? sortedBackups[0].createdAt.toDate() : null
          if (lastBackupDate) {
            lastBackup = lastBackupDate.toLocaleDateString("pt-BR")
          }
        }
      }

      document.getElementById("total-backups").textContent = backupsSnapshot.size
      document.getElementById("total-size").textContent = formatFileSize(totalSize)
      document.getElementById("last-backup").textContent = lastBackup
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error)
    }
  }

  // Formatar tamanho do arquivo
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Mostrar modal de progresso
  function showProgressModal(title, description) {
    document.getElementById("progress-title").textContent = title
    document.getElementById("progress-description").textContent = description
    document.getElementById("progress-modal").classList.remove("hidden")
  }

  // Esconder modal de progresso
  function hideProgressModal() {
    document.getElementById("progress-modal").classList.add("hidden")
    updateProgress(0)
  }

  // Atualizar progresso
  function updateProgress(percent, text = null) {
    document.getElementById("progress-bar").style.width = percent + "%"
    document.getElementById("progress-text").textContent = percent + "%"
    if (text) {
      document.getElementById("progress-description").textContent = text
    }
  }

  // Salvar configurações de backup automático
  async function saveAutoBackupSettings() {
    const enabled = document.getElementById("auto-backup-toggle").checked
    const frequency = document.getElementById("backup-frequency").value
    const time = document.getElementById("backup-time").value
    const retention = document.getElementById("backup-retention").value

    try {
      await db
        .collection("system")
        .doc("backup_settings")
        .set({
          enabled: enabled,
          frequency: frequency,
          time: time,
          retention: Number.parseInt(retention),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: auth.currentUser.uid,
        })

      Swal.fire({
        title: "Sucesso!",
        text: "Configurações salvas com sucesso.",
        icon: "success",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      Swal.fire({
        title: "Erro",
        text: "Erro ao salvar configurações.",
        icon: "error",
      })
    }
  }

  // Carregar configurações de backup automático
  async function loadAutoBackupSettings() {
    try {
      const settingsDoc = await db.collection("system").doc("backup_settings").get()

      if (settingsDoc.exists) {
        const settings = settingsDoc.data()
        document.getElementById("auto-backup-toggle").checked = settings.enabled || false
        document.getElementById("backup-frequency").value = settings.frequency || "daily"
        document.getElementById("backup-time").value = settings.time || "02:00"
        document.getElementById("backup-retention").value = settings.retention || 30

        document.getElementById("auto-backup-status").textContent = settings.enabled ? "Ativo" : "Inativo"
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    }
  }

  // Logout
  window.logout = () => {
    Swal.fire({
      title: "Sair do Sistema",
      text: "Tem certeza que deseja sair?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, sair",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        auth.signOut().then(() => {
          window.location.href = "/index.html"
        })
      }
    })
  }

  // Event listeners
  document.getElementById("create-backup-btn").addEventListener("click", createBackup)
  document.getElementById("restore-backup-btn").addEventListener("click", restoreBackup)
  document.getElementById("refresh-backups").addEventListener("click", loadBackupHistory)
  document.getElementById("save-auto-settings").addEventListener("click", saveAutoBackupSettings)

  // Habilitar/desabilitar botão de restauração
  document.getElementById("confirm-restore").addEventListener("change", function () {
    document.getElementById("restore-backup-btn").disabled = !this.checked
  })

  // Inicializar
  auth.onAuthStateChanged(async (user) => {
    if (user && (await checkAdminAccess())) {
      loadBackupHistory()
      updateStats()
      loadAutoBackupSettings()
    }
  })
})
