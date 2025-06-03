document.addEventListener("DOMContentLoaded", () => {
  const firebase = window.firebase
  const Swal = window.Swal

  let db = null
  let currentUser = null
  let refreshInterval = null

  // Verificar autenticação e permissões
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/index.html"
      return
    }

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get()
    if (!userDoc.exists || userDoc.data().role !== "subdirector") {
      Swal.fire({
        title: "Acesso Negado!",
        text: "Você não tem permissão para acessar esta página.",
        icon: "error",
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          content: 'my-swal-text',
          confirmButton: 'my-swal-confirm-button',
        }
      }).then(() => {
        window.location.href = "/main.html"
      })
      return
    }

    currentUser = user
    db = firebase.firestore()
    await initializeDashboard()
  })

  async function initializeDashboard() {
    try {
      await Promise.all([
        // loadAlerts(),
        loadStats(),
        loadConflicts(),
        // loadRecentActivity(),
        loadCoordinationsStatus(),
        // loadTasks(),
        updateSystemStatus(),
      ])

      setupRealTimeUpdates()
      setupEventListeners()
    } catch (error) {
      console.error("Erro ao inicializar dashboard:", error)
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível carregar o dashboard.",
        icon: "error",
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          content: 'my-swal-text',
          confirmButton: 'my-swal-confirm-button',
        }
      })
    }
  }

  // async function loadAlerts() {
  //   try {
  //     const alertsContainer = document.getElementById("alerts-container")

  //     // Mock data para alertas críticos
  //     const alerts = [
  //       {
  //         type: "error",
  //         title: "Conflito de Horário Detectado",
  //         message: "Professor João Silva tem conflito na Sala 201 às 14:00",
  //         time: "Há 5 minutos",
  //         urgent: true,
  //       },
  //       {
  //         type: "warning",
  //         title: "Sala em Manutenção",
  //         message: "Lab. Informática 2 indisponível até amanhã",
  //         time: "Há 1 hora",
  //         urgent: false,
  //       },
  //       {
  //         type: "info",
  //         title: "Backup Automático",
  //         message: "Backup do sistema concluído com sucesso",
  //         time: "Há 2 horas",
  //         urgent: false,
  //       },
  //     ]

  //     alertsContainer.innerHTML = ""

  //     alerts.forEach((alert) => {
  //       const alertCard = document.createElement("div")
  //       alertCard.className = `alert-card ${alert.type}`

  //       alertCard.innerHTML = `
  //                   <div style="display: flex; justify-content: space-between; align-items: flex-start;">
  //                       <div style="flex: 1;">
  //                           <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
  //                               <i class="fas fa-${alert.type === "error" ? "exclamation-triangle" : alert.type === "warning" ? "exclamation-circle" : "info-circle"}"></i>
  //                               <strong>${alert.title}</strong>
  //                               ${alert.urgent ? '<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">URGENTE</span>' : ""}
  //                           </div>
  //                           <p style="margin: 0; font-size: 14px;">${alert.message}</p>
  //                           <small style="color: var(--text-secondary);">${alert.time}</small>
  //                       </div>
  //                       <button onclick="dismissAlert(this)" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">
  //                           <i class="fas fa-times"></i>
  //                       </button>
  //                   </div>
  //               `

  //       alertsContainer.appendChild(alertCard)
  //     })
  //   } catch (error) {
  //     console.error("Erro ao carregar alertas:", error)
  //   }
  // }

  async function loadStats() {
    try {
      // Simular carregamento de estatísticas em tempo real
      const stats = {
        activeConflicts: Math.floor(Math.random() * 5) + 1,
        pendingSchedules: Math.floor(Math.random() * 10) + 5,
        onlineTeachers: Math.floor(Math.random() * 20) + 30,
        occupiedRooms: Math.floor(Math.random() * 15) + 10,
      }

      document.getElementById("active-conflicts").textContent = stats.activeConflicts
      document.getElementById("pending-schedules").textContent = stats.pendingSchedules
      document.getElementById("online-teachers").textContent = stats.onlineTeachers
      document.getElementById("occupied-rooms").textContent = `${stats.occupiedRooms}/25`
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  async function loadConflicts() {
    try {
      const conflictsList = document.getElementById("conflicts-list")

      // Mock data para conflitos
      const conflicts = [
        {
          id: "1",
          type: "schedule",
          title: "Conflito de Horário - Sala 201",
          description: "Prof. João Silva e Prof. Maria Santos agendados para o mesmo horário",
          severity: "high",
          time: "14:00 - 15:00",
          room: "Sala 201",
          professors: ["João Silva", "Maria Santos"],
          status: "pending",
        },
        {
          id: "2",
          type: "resource",
          title: "Equipamento Indisponível",
          description: "Projetor do Lab. Informática 1 com defeito",
          severity: "medium",
          room: "Lab. Informática 1",
          equipment: "Projetor",
          status: "pending",
        },
        {
          id: "3",
          type: "teacher",
          title: "Professor Ausente",
          description: "Prof. Ana Costa não confirmou presença para aula das 16:00",
          severity: "low",
          time: "16:00 - 17:00",
          professor: "Ana Costa",
          status: "pending",
        },
      ]

      conflictsList.innerHTML = ""

      if (conflicts.length === 0) {
        conflictsList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px; color: #10b981;"></i>
                        <h3>Nenhum conflito ativo</h3>
                        <p>Todos os horários estão funcionando normalmente.</p>
                    </div>
                `
        return
      }

      conflicts.forEach((conflict) => {
        const conflictCard = createConflictCard(conflict)
        conflictsList.appendChild(conflictCard)
      })
    } catch (error) {
      console.error("Erro ao carregar conflitos:", error)
    }
  }

  function createConflictCard(conflict) {
    const card = document.createElement("div")
    card.className = "conflict-card"
    card.style.cssText = `
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            padding: 15px;
            margin-bottom: 15px;
            background: white;
            border-left: 4px solid ${conflict.severity === "high" ? "#ef4444" : conflict.severity === "medium" ? "#f59e0b" : "#10b981"};
        `

    const severityColors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }

    const severityNames = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    }

    const typeIcons = {
      schedule: "fas fa-calendar-times",
      resource: "fas fa-tools",
      teacher: "fas fa-user-times",
    }

    card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="${typeIcons[conflict.type]}" style="color: var(--primary-blue);"></i>
                    <h4 style="margin: 0; font-size: 16px;">${conflict.title}</h4>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[conflict.severity]}">
                        ${severityNames[conflict.severity]}
                    </span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-success btn-sm" onclick="resolveConflict('${conflict.id}')">
                        <i class="fas fa-check"></i>
                        Resolver
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="viewConflictDetails('${conflict.id}')">
                        <i class="fas fa-eye"></i>
                        Detalhes
                    </button>
                </div>
            </div>
            
            <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 14px;">
                ${conflict.description}
            </p>
            
            <div style="display: flex; gap: 15px; font-size: 12px; color: var(--text-secondary);">
                ${conflict.time ? `<span><i class="fas fa-clock"></i> ${conflict.time}</span>` : ""}
                ${conflict.room ? `<span><i class="fas fa-door-open"></i> ${conflict.room}</span>` : ""}
                ${conflict.professor ? `<span><i class="fas fa-user"></i> ${conflict.professor}</span>` : ""}
            </div>
        `

    return card
  }

  // async function loadRecentActivity() {
  //   try {
  //     const activityContainer = document.getElementById("recent-activity")

  //     // Mock data para atividade recente
  //     const activities = [
  //       {
  //         type: "schedule_created",
  //         user: "João Silva",
  //         action: "criou um novo horário",
  //         target: "Programação I - EIE-2A",
  //         time: new Date(Date.now() - 300000), // 5 min atrás
  //         icon: "fas fa-plus",
  //         color: "#10b981",
  //       },
  //       {
  //         type: "conflict_resolved",
  //         user: "Maria Santos",
  //         action: "resolveu conflito",
  //         target: "Sala 201 - 14:00",
  //         time: new Date(Date.now() - 900000), // 15 min atrás
  //         icon: "fas fa-check",
  //         color: "#3b82f6",
  //       },
  //       {
  //         type: "teacher_added",
  //         user: "Ana Costa",
  //         action: "adicionou professor",
  //         target: "Paulo Mendes",
  //         time: new Date(Date.now() - 1800000), // 30 min atrás
  //         icon: "fas fa-user-plus",
  //         color: "#8b5cf6",
  //       },
  //       {
  //         type: "room_updated",
  //         user: "Carlos Lima",
  //         action: "atualizou sala",
  //         target: "Lab. Informática 2",
  //         time: new Date(Date.now() - 3600000), // 1 hora atrás
  //         icon: "fas fa-edit",
  //         color: "#f59e0b",
  //       },
  //     ]

  //     activityContainer.innerHTML = ""

  //     activities.forEach((activity) => {
  //       const activityItem = document.createElement("div")
  //       activityItem.style.cssText = `
  //                   display: flex;
  //                   align-items: center;
  //                   gap: 15px;
  //                   padding: 12px 0;
  //                   border-bottom: 1px solid var(--border-light);
  //               `

  //       const timeAgo = getTimeAgo(activity.time)

  //       activityItem.innerHTML = `
  //                   <div style="width: 32px; height: 32px; border-radius: 50%; background: ${activity.color}20; display: flex; align-items: center; justify-content: center;">
  //                       <i class="${activity.icon}" style="color: ${activity.color}; font-size: 14px;"></i>
  //                   </div>
  //                   <div style="flex: 1;">
  //                       <p style="margin: 0; font-size: 14px;">
  //                           <strong>${activity.user}</strong> ${activity.action} <em>${activity.target}</em>
  //                       </p>
  //                       <small style="color: var(--text-secondary);">${timeAgo}</small>
  //                   </div>
  //               `

  //       activityContainer.appendChild(activityItem)
  //     })
  //   } catch (error) {
  //     console.error("Erro ao carregar atividade recente:", error)
  //   }
  // }

  async function loadCoordinationsStatus() {
    try {
      const statusContainer = document.getElementById("coordinations-status")

      // Mock data para status das coordenações
      const coordinations = [
        {
          name: "EIE",
          coordinator: "Ezequiel Mazezela",
          teachers: 12,
          schedules: 45,
          conflicts: 1,
          status: "active",
          lastUpdate: new Date(Date.now() - 1800000),
        },
        {
          name: "GSI",
          coordinator: "Paulo Dala",
          teachers: 8,
          schedules: 32,
          conflicts: 0,
          status: "active",
          lastUpdate: new Date(Date.now() - 3600000),
        },
        {
          name: "INF",
          coordinator: "Diassilua Paulo",
          teachers: 15,
          schedules: 60,
          conflicts: 2,
          status: "warning",
          lastUpdate: new Date(Date.now() - 7200000),
        },
      ]

      statusContainer.innerHTML = ""

      coordinations.forEach((coord) => {
        const coordCard = document.createElement("div")
        coordCard.style.cssText = `
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius);
                    padding: 15px;
                    margin-bottom: 15px;
                    background: white;
                `

        const statusColor = coord.status === "active" ? "#10b981" : "#f59e0b"
        const statusText = coord.status === "active" ? "Ativa" : "Atenção"

        coordCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-size: 16px;">${coord.name}</h4>
                        <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                            ${statusText}
                        </span>
                    </div>
                    
                    <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 14px;">
                        Coordenador: ${coord.coordinator}
                    </p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                        <div>Professores: <strong>${coord.teachers}</strong></div>
                        <div>Horários: <strong>${coord.schedules}</strong></div>
                        <div>Conflitos: <strong style="color: ${coord.conflicts > 0 ? "#ef4444" : "#10b981"};">${coord.conflicts}</strong></div>
                        <div>Atualizado: <strong>${getTimeAgo(coord.lastUpdate)}</strong></div>
                    </div>
                `

        statusContainer.appendChild(coordCard)
      })
    } catch (error) {
      console.error("Erro ao carregar status das coordenações:", error)
    }
  }

  // async function loadTasks() {
  //   try {
  //     const tasksTable = document.getElementById("tasks-table")

  //     // Mock data para tarefas
  //     const tasks = [
  //       {
  //         id: "1",
  //         title: "Revisar horários da semana",
  //         priority: "high",
  //         responsible: "João Silva",
  //         deadline: new Date(Date.now() + 86400000), // amanhã
  //         status: "pending",
  //       },
  //       {
  //         id: "2",
  //         title: "Atualizar dados dos professores",
  //         priority: "medium",
  //         responsible: "Maria Santos",
  //         deadline: new Date(Date.now() + 172800000), // 2 dias
  //         status: "in_progress",
  //       },
  //       {
  //         id: "3",
  //         title: "Preparar relatório mensal",
  //         priority: "low",
  //         responsible: "Ana Costa",
  //         deadline: new Date(Date.now() + 604800000), // 1 semana
  //         status: "pending",
  //       },
  //     ]

  //     tasksTable.innerHTML = ""

  //     if (tasks.length === 0) {
  //       tasksTable.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma tarefa pendente</td></tr>'
  //       return
  //     }

  //     tasks.forEach((task) => {
  //       const row = document.createElement("tr")

  //       const priorityColors = {
  //         high: "bg-red-100 text-red-800",
  //         medium: "bg-yellow-100 text-yellow-800",
  //         low: "bg-green-100 text-green-800",
  //       }

  //       const statusColors = {
  //         pending: "bg-gray-100 text-gray-800",
  //         in_progress: "bg-blue-100 text-blue-800",
  //         completed: "bg-green-100 text-green-800",
  //       }

  //       const statusNames = {
  //         pending: "Pendente",
  //         in_progress: "Em Andamento",
  //         completed: "Concluída",
  //       }

  //       row.innerHTML = `
  //                   <td>${task.title}</td>
  //                   <td>
  //                       <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}">
  //                           ${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
  //                       </span>
  //                   </td>
  //                   <td>${task.responsible}</td>
  //                   <td>${task.deadline.toLocaleDateString("pt-BR")}</td>
  //                   <td>
  //                       <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}">
  //                           ${statusNames[task.status]}
  //                       </span>
  //                   </td>
  //                   <td>
  //                       <button class="btn btn-secondary btn-sm" onclick="editTask('${task.id}')">
  //                           <i class="fas fa-edit"></i>
  //                       </button>
  //                       <button class="btn btn-success btn-sm" onclick="completeTask('${task.id}')">
  //                           <i class="fas fa-check"></i>
  //                       </button>
  //                   </td>
  //               `

  //       tasksTable.appendChild(row)
  //     })
  //   } catch (error) {
  //     console.error("Erro ao carregar tarefas:", error)
  //   }
  // }

  async function updateSystemStatus() {
    try {
      const lastSyncElement = document.getElementById("last-sync")
      lastSyncElement.textContent = new Date().toLocaleTimeString("pt-BR")
    } catch (error) {
      console.error("Erro ao atualizar status do sistema:", error)
    }
  }

  function setupRealTimeUpdates() {
    // Atualizar dados a cada 30 segundos
    refreshInterval = setInterval(async () => {
      await Promise.all([loadStats(), updateSystemStatus()])
    }, 30000)
  }

  function setupEventListeners() {
    // Cleanup interval quando sair da página
    window.addEventListener("beforeunload", () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })
  }

  function getTimeAgo(date) {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days} dia${days > 1 ? "s" : ""} atrás`
    if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""} atrás`
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? "s" : ""} atrás`
    return "Agora mesmo"
  }

  // Funções globais
  window.dismissAlert = (button) => {
    const alertCard = button.closest(".alert-card")
    alertCard.style.animation = "slideOut 0.3s ease-out"
    setTimeout(() => {
      alertCard.remove()
    }, 300)
  }

  window.resolveConflict = (conflictId) => {
    Swal.fire({
      title: "Resolver Conflito",
      text: "Como deseja resolver este conflito?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Resolver Automaticamente",
      cancelButtonText: "Resolver Manualmente",
      denyButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
        denyButton: 'my-swal-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        autoResolveConflict(conflictId)
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        manualResolveConflict(conflictId)
      }
    })
  }

  window.resolveAllConflicts = () => {
    Swal.fire({
      title: "Resolver Todos os Conflitos",
      text: "Deseja resolver automaticamente todos os conflitos ativos?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, resolver todos",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Resolvendo Conflitos",
          text: "Processando soluções automáticas...",
          allowOutsideClick: false,
          showConfirmButton: false,
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
          },
          willOpen: () => {
            Swal.showLoading()
          },
        })

        setTimeout(() => {
          Swal.fire({
            title: "Sucesso!",
            text: "Todos os conflitos foram resolvidos.",
            icon: "success",
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              content: 'my-swal-text',
              confirmButton: 'my-swal-confirm-button',
            }
          })
          loadConflicts()
          loadStats()
        }, 3000)
      }
    })
  }

  window.generateEmergencySchedule = () => {
    Swal.fire({
      title: "Horário de Emergência",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Professor:</label>
                    <select class="detail-input" id="emergency-teacher">
                        <option>João Silva</option>
                        <option>Maria Santos</option>
                        <option>Ana Costa</option>
                    </select>
                    
                    <label class="form-label">Disciplina:</label>
                    <select class="detail-input" id="emergency-subject">
                        <option>Programação I</option>
                        <option>Matemática</option>
                        <option>Física</option>
                    </select>
                    
                    <label class="form-label">Turma:</label>
                    <select class="detail-input" id="emergency-class">
                        <option>EIE-2A</option>
                        <option>GSI-1B</option>
                        <option>MEC-3A</option>
                    </select>
                    
                    <label class="form-label">Horário:</label>
                    <input type="time" class="detail-input" id="emergency-time" value="14:00">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Gerar Horário",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Sucesso!",
          text: "Horário de emergência gerado com sucesso.",
          icon: "success",
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
            confirmButton: 'my-swal-confirm-button',
          }
        })
      }
    })
  }

  window.sendBroadcastNotification = () => {
    Swal.fire({
      title: "Notificação Geral",
      input: "textarea",
      inputLabel: "Mensagem:",
      inputPlaceholder: "Digite a mensagem para todos os usuários...",
      inputAttributes: {
        class: 'detail-input'
      },
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        inputLabel: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          title: "Enviado!",
          text: "Notificação enviada para todos os usuários.",
          icon: "success",
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
            confirmButton: 'my-swal-confirm-button',
          }
        })
      }
    })
  }

  window.viewSystemStatus = () => {
    Swal.fire({
      title: "Status Detalhado do Sistema",
      html: `
                <div style="text-align: left;">
                    <h4>Serviços</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Base de Dados</span>
                            <span style="color: #10b981;">✓ Online</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Servidor Web</span>
                            <span style="color: #10b981;">✓ Online</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Sistema de Backup</span>
                            <span style="color: #f59e0b;">⚠ Atenção</span>
                        </div>
                    </div>
                    
                    <h4>Estatísticas</h4>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Usuários Online</span>
                            <span>47</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Uso de CPU</span>
                            <span>23%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Uso de Memória</span>
                            <span>67%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Espaço em Disco</span>
                            <span>45% usado</span>
                        </div>
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
      }
    })
  }

  window.exportDailyReport = () => {
    Swal.fire({
      title: "Exportar Relatório Diário",
      text: "Gerando relatório do dia...",
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
      },
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Relatório Gerado!",
        text: "O relatório diário foi gerado com sucesso.",
        icon: "success",
        showCancelButton: false,
        confirmButtonText: "Download",
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          content: 'my-swal-text',
          confirmButton: 'my-swal-confirm-button',
        }
      })
    }, 2000)
  }

  window.refreshActivity = () => {
    loadRecentActivity()
    Swal.fire({
      title: "Atualizado!",
      text: "Atividade recente atualizada.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
      }
    })
  }

  window.addNewTask = () => {
    Swal.fire({
      title: "Nova Tarefa",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Título:</label>
                    <input type="text" class="detail-input" id="task-title" placeholder="Título da tarefa">
                    
                    <label class="form-label">Responsável:</label>
                    <select class="detail-input" id="task-responsible">
                        <option>João Silva</option>
                        <option>Maria Santos</option>
                        <option>Ana Costa</option>
                    </select>
                    
                    <label class="form-label">Prioridade:</label>
                    <select class="detail-input" id="task-priority">
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                    </select>
                    
                    <label class="form-label">Prazo:</label>
                    <input type="date" class="detail-input" id="task-deadline">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Criar Tarefa",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Sucesso!",
          text: "Tarefa criada com sucesso.",
          icon: "success",
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
            confirmButton: 'my-swal-confirm-button',
          }
        })
        loadTasks()
      }
    })
  }

  window.editTask = (taskId) => {
    Swal.fire({
      title: "Editar Tarefa",
      text: "Funcionalidade de edição será implementada.",
      icon: "info",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
      }
    })
  }

  window.completeTask = (taskId) => {
    Swal.fire({
      title: "Concluir Tarefa",
      text: "Marcar esta tarefa como concluída?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, concluir",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Concluída!",
          text: "Tarefa marcada como concluída.",
          icon: "success",
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
            confirmButton: 'my-swal-confirm-button',
          }
        })
        loadTasks()
      }
    })
  }

  function autoResolveConflict(conflictId) {
    Swal.fire({
      title: "Resolvendo Conflito",
      text: "Aplicando solução automática...",
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        content: 'my-swal-text',
      },
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Resolvido!",
        text: "Conflito resolvido automaticamente.",
        icon: "success",
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          content: 'my-swal-text',
          confirmButton: 'my-swal-confirm-button',
        }
      })
      loadConflicts()
      loadStats()
    }, 2000)
  }

  function manualResolveConflict(conflictId) {
    Swal.fire({
      title: "Resolução Manual",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Solução:</label>
                    <select class="detail-input" id="solution-type">
                        <option>Alterar horário</option>
                        <option>Trocar sala</option>
                        <option>Substituir professor</option>
                        <option>Cancelar aula</option>
                    </select>
                    
                    <label class="form-label">Observações:</label>
                    <textarea class="detail-input" id="solution-notes" placeholder="Observações sobre a solução..."></textarea>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Aplicar Solução",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm-button',
        cancelButton: 'my-swal-cancel-button',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Resolvido!",
          text: "Conflito resolvido manualmente.",
          icon: "success",
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            content: 'my-swal-text',
            confirmButton: 'my-swal-confirm-button',
          }
        })
        loadConflicts()
        loadStats()
      }
    })
  }
})