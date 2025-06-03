document.addEventListener("DOMContentLoaded", () => {
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

  const firebase = window.firebase // Declare firebase variable
  const Swal = window.Swal // Declare Swal variable

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  const db = firebase.firestore()
  const auth = firebase.auth()

  // Definição das permissões do sistema
  const systemPermissions = [
    {
      category: "Gestão de Usuários",
      permissions: [
        { id: "users.create", name: "Criar Usuários", description: "Criar novos usuários no sistema" },
        { id: "users.edit", name: "Editar Usuários", description: "Editar informações de usuários" },
        { id: "users.delete", name: "Deletar Usuários", description: "Remover usuários do sistema" },
        { id: "users.view", name: "Visualizar Usuários", description: "Ver lista de usuários" },
      ],
    },
    {
      category: "Gestão de Horários",
      permissions: [
        { id: "schedules.create", name: "Criar Horários", description: "Criar novos horários" },
        { id: "schedules.edit", name: "Editar Horários", description: "Modificar horários existentes" },
        { id: "schedules.delete", name: "Deletar Horários", description: "Remover horários" },
        { id: "schedules.view", name: "Visualizar Horários", description: "Ver horários" },
        { id: "schedules.approve", name: "Aprovar Horários", description: "Aprovar horários criados" },
      ],
    },
    {
      category: "Gestão de Professores",
      permissions: [
        { id: "teachers.create", name: "Adicionar Professores", description: "Adicionar novos professores" },
        { id: "teachers.edit", name: "Editar Professores", description: "Editar dados de professores" },
        { id: "teachers.delete", name: "Remover Professores", description: "Remover professores" },
        { id: "teachers.view", name: "Visualizar Professores", description: "Ver lista de professores" },
      ],
    },
    {
      category: "Gestão de Turmas",
      permissions: [
        { id: "classes.create", name: "Criar Turmas", description: "Criar novas turmas" },
        { id: "classes.edit", name: "Editar Turmas", description: "Modificar turmas existentes" },
        { id: "classes.delete", name: "Deletar Turmas", description: "Remover turmas" },
        { id: "classes.view", name: "Visualizar Turmas", description: "Ver turmas" },
      ],
    },
    {
      category: "Relatórios",
      permissions: [
        { id: "reports.view", name: "Visualizar Relatórios", description: "Acessar relatórios do sistema" },
        { id: "reports.export", name: "Exportar Relatórios", description: "Exportar relatórios em PDF/Excel" },
        { id: "reports.advanced", name: "Relatórios Avançados", description: "Acessar relatórios avançados" },
      ],
    },
    {
      category: "Sistema",
      permissions: [
        { id: "system.backup", name: "Backup", description: "Realizar backup do sistema" },
        { id: "system.restore", name: "Restaurar", description: "Restaurar backup do sistema" },
        { id: "system.logs", name: "Logs", description: "Visualizar logs do sistema" },
        { id: "system.settings", name: "Configurações", description: "Alterar configurações do sistema" },
      ],
    },
  ]

  const roles = ["admin", "director", "subdirector", "coordenador", "professor"]
  let currentPermissions = {}

  // Verificar se é admin
  async function checkAdminAccess() {
    const user = auth.currentUser
    if (!user) {
      window.location.href = "/login"
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

  // Carregar permissões atuais
  async function loadPermissions() {
    try {
      showLoading()

      // Carregar permissões do Firestore
      const permissionsDoc = await db.collection("system").doc("permissions").get()

      if (permissionsDoc.exists) {
        currentPermissions = permissionsDoc.data()
      } else {
        // Criar permissões padrão se não existirem
        currentPermissions = createDefaultPermissions()
        await savePermissions()
      }

      renderPermissionsTable()
      updateStats()
      loadRecentActivity()
      hideLoading()
    } catch (error) {
      console.error("Erro ao carregar permissões:", error)
      Swal.fire({
        title: "Erro",
        text: "Erro ao carregar permissões.",
        icon: "error",
      })
      hideLoading()
    }
  }

  // Criar permissões padrão
  function createDefaultPermissions() {
    const defaultPerms = {}

    // Admin tem todas as permissões
    defaultPerms.admin = {}
    systemPermissions.forEach((category) => {
      category.permissions.forEach((perm) => {
        defaultPerms.admin[perm.id] = true
      })
    })

    // Director tem a maioria das permissões, exceto sistema
    defaultPerms.director = {}
    systemPermissions.forEach((category) => {
      category.permissions.forEach((perm) => {
        if (category.category !== "Sistema" || perm.id === "system.settings") {
          defaultPerms.director[perm.id] = true
        } else {
          defaultPerms.director[perm.id] = false
        }
      })
    })

    // Subdirector tem permissões operacionais
    defaultPerms.subdirector = {}
    systemPermissions.forEach((category) => {
      category.permissions.forEach((perm) => {
        if (
          ["Gestão de Horários", "Gestão de Professores", "Gestão de Turmas", "Relatórios"].includes(category.category)
        ) {
          defaultPerms.subdirector[perm.id] = true
        } else {
          defaultPerms.subdirector[perm.id] = false
        }
      })
    })

    // Coordenador tem permissões limitadas
    defaultPerms.coordenador = {}
    systemPermissions.forEach((category) => {
      category.permissions.forEach((perm) => {
        if (
          category.category === "Gestão de Professores" ||
          category.category === "Gestão de Turmas" ||
          (category.category === "Relatórios" && perm.id === "reports.view")
        ) {
          defaultPerms.coordenador[perm.id] = true
        } else {
          defaultPerms.coordenador[perm.id] = false
        }
      })
    })

    // Professor tem apenas visualização
    defaultPerms.professor = {}
    systemPermissions.forEach((category) => {
      category.permissions.forEach((perm) => {
        if (perm.id.includes(".view") && !perm.id.includes("users.view")) {
          defaultPerms.professor[perm.id] = true
        } else {
          defaultPerms.professor[perm.id] = false
        }
      })
    })

    return defaultPerms
  }

  // Renderizar tabela de permissões
  function renderPermissionsTable() {
    const tableBody = document.getElementById("permissions-table")
    tableBody.innerHTML = ""

    systemPermissions.forEach((category) => {
      // Cabeçalho da categoria
      const categoryRow = document.createElement("tr")
      categoryRow.className = "bg-gray-50"
      categoryRow.innerHTML = `
                <td colspan="6" class="px-6 py-3 text-sm font-semibold text-gray-900">
                    <i class="fas fa-folder mr-2"></i>
                    ${category.category}
                </td>
            `
      tableBody.appendChild(categoryRow)

      // Permissões da categoria
      category.permissions.forEach((permission) => {
        const row = document.createElement("tr")
        row.className = "hover:bg-gray-50"

        let rowHTML = `
                    <td class="px-6 py-4">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${permission.name}</div>
                            <div class="text-sm text-gray-500">${permission.description}</div>
                        </div>
                    </td>
                `

        roles.forEach((role) => {
          const isChecked = currentPermissions[role] && currentPermissions[role][permission.id]
          const isDisabled = role === "admin" // Admin sempre tem todas as permissões

          rowHTML += `
                        <td class="px-6 py-4 text-center">
                            <input type="checkbox" 
                                   id="${permission.id}-${role}"
                                   data-permission="${permission.id}"
                                   data-role="${role}"
                                   ${isChecked ? "checked" : ""}
                                   ${isDisabled ? "disabled" : ""}
                                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${isDisabled ? "opacity-50" : "cursor-pointer"}"
                                   onchange="updatePermission('${permission.id}', '${role}', this.checked)">
                        </td>
                    `
        })

        row.innerHTML = rowHTML
        tableBody.appendChild(row)
      })
    })
  }

  // Atualizar permissão
  window.updatePermission = (permissionId, role, value) => {
    if (!currentPermissions[role]) {
      currentPermissions[role] = {}
    }
    currentPermissions[role][permissionId] = value

    // Marcar como modificado
    document.getElementById("save-permissions").classList.add("bg-orange-600", "hover:bg-orange-700")
    document.getElementById("save-permissions").classList.remove("bg-blue-600", "hover:bg-blue-700")
  }

  // Salvar permissões
  async function savePermissions() {
    try {
      showLoading()

      await db.collection("system").doc("permissions").set(currentPermissions)

      // Log da atividade
      await db.collection("system").doc("activity_logs").collection("logs").add({
        action: "permissions_updated",
        user: auth.currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        details: "Permissões do sistema atualizadas",
      })

      Swal.fire({
        title: "Sucesso!",
        text: "Permissões salvas com sucesso.",
        icon: "success",
      })

      // Resetar botão
      const saveBtn = document.getElementById("save-permissions")
      saveBtn.classList.remove("bg-orange-600", "hover:bg-orange-700")
      saveBtn.classList.add("bg-blue-600", "hover:bg-blue-700")

      hideLoading()
    } catch (error) {
      console.error("Erro ao salvar permissões:", error)
      Swal.fire({
        title: "Erro",
        text: "Erro ao salvar permissões.",
        icon: "error",
      })
      hideLoading()
    }
  }

  // Atualizar estatísticas
  function updateStats() {
    const totalRoles = roles.length
    let activePermissions = 0

    roles.forEach((role) => {
      if (currentPermissions[role]) {
        Object.values(currentPermissions[role]).forEach((value) => {
          if (value) activePermissions++
        })
      }
    })

    document.getElementById("total-roles").textContent = totalRoles
    document.getElementById("active-permissions").textContent = activePermissions
    document.getElementById("last-update").textContent = new Date().toLocaleDateString("pt-BR")
  }

  // Carregar atividade recente
  async function loadRecentActivity() {
    try {
      const logsSnapshot = await db
        .collection("system")
        .doc("activity_logs")
        .collection("logs")
        .orderBy("timestamp", "desc")
        .limit(5)
        .get()

      const activityContainer = document.getElementById("recent-activity")
      activityContainer.innerHTML = ""

      if (logsSnapshot.empty) {
        activityContainer.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        <i class="fas fa-history text-2xl mb-2"></i>
                        <p>Nenhuma atividade recente</p>
                    </div>
                `
        return
      }

      logsSnapshot.docs.forEach((doc) => {
        const log = doc.data()
        const activityItem = document.createElement("div")
        activityItem.className = "flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"

        const timestamp = log.timestamp ? log.timestamp.toDate().toLocaleString("pt-BR") : "Data não disponível"

        activityItem.innerHTML = `
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-shield-alt text-blue-600 text-sm"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">${log.details || "Atividade do sistema"}</p>
                        <p class="text-xs text-gray-500">${timestamp}</p>
                    </div>
                `

        activityContainer.appendChild(activityItem)
      })
    } catch (error) {
      console.error("Erro ao carregar atividade:", error)
    }
  }

  // Criar novo perfil
  async function createNewRole() {
    const roleName = document.getElementById("role-name").value.trim()
    const roleDescription = document.getElementById("role-description").value.trim()

    if (!roleName) {
      Swal.fire({
        title: "Erro",
        text: "Nome do perfil é obrigatório.",
        icon: "error",
      })
      return
    }

    try {
      showLoading()

      // Adicionar novo perfil ao sistema
      const roleId = roleName.toLowerCase().replace(/\s+/g, "_")

      await db.collection("system").doc("custom_roles").collection("roles").doc(roleId).set({
        name: roleName,
        description: roleDescription,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.currentUser.uid,
      })

      // Criar permissões padrão para o novo perfil
      currentPermissions[roleId] = {}
      systemPermissions.forEach((category) => {
        category.permissions.forEach((perm) => {
          currentPermissions[roleId][perm.id] = false
        })
      })

      await savePermissions()

      Swal.fire({
        title: "Sucesso!",
        text: "Novo perfil criado com sucesso.",
        icon: "success",
      })

      document.getElementById("new-role-form").reset()
      hideLoading()
    } catch (error) {
      console.error("Erro ao criar perfil:", error)
      Swal.fire({
        title: "Erro",
        text: "Erro ao criar novo perfil.",
        icon: "error",
      })
      hideLoading()
    }
  }

  // Funções utilitárias
  function showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
  }

  function hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
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
  document.getElementById("save-permissions").addEventListener("click", savePermissions)
  document.getElementById("new-role-form").addEventListener("submit", (e) => {
    e.preventDefault()
    createNewRole()
  })

  // Inicializar
  auth.onAuthStateChanged(async (user) => {
    if (user && (await checkAdminAccess())) {
      loadPermissions()
    }
  })
})
