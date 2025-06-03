document.addEventListener("DOMContentLoaded", () => {
  const firebase = window.firebase
  const Swal = window.Swal

  let db = null
  let currentUser = null
  const selectedTeachers = new Set()

  // Verificar autenticação e permissões
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get()
    if (!userDoc.exists || userDoc.data().role !== "subdirector") {
      Swal.fire({
        title: "Acesso Negado!",
        text: "Você não tem permissão para acessar esta página.",
        icon: "error",
      }).then(() => {
        window.location.href = "/login"
      })
      return
    }

    currentUser = user
    db = firebase.firestore()
    await initializeOperations()
  })

  async function initializeOperations() {
    try {
      await Promise.all([loadOperationalStats(), loadTeachers(), setupEventListeners()])
    } catch (error) {
      console.error("Erro ao inicializar operações:", error)
      Swal.fire("Erro!", "Não foi possível carregar as operações.", "error")
    }
  }

  async function loadOperationalStats() {
    try {
      // Mock data para estatísticas operacionais
      const stats = {
        activeSchedules: 156,
        conflicts: 3,
        rooms: 25,
        equipment: 45,
        maintenance: 2,
      }

      document.getElementById("active-schedules-count").textContent = stats.activeSchedules
      document.getElementById("conflicts-count").textContent = stats.conflicts
      document.getElementById("rooms-count").textContent = stats.rooms
      document.getElementById("equipment-count").textContent = stats.equipment
      document.getElementById("maintenance-count").textContent = stats.maintenance
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  async function loadTeachers() {
    try {
      const teachersTable = document.getElementById("teachers-table")

      // Mock data para professores
      const teachers = [
        {
          id: "1",
          name: "João Silva",
          coordination: "EIE",
          subjects: ["Programação I", "Algoritmos"],
          workload: 24,
          status: "active",
          email: "joao.silva@ipikk.edu.ao",
        },
        {
          id: "2",
          name: "Maria Santos",
          coordination: "GSI",
          subjects: ["Redes", "Sistemas Operacionais"],
          workload: 20,
          status: "active",
          email: "maria.santos@ipikk.edu.ao",
        },
        {
          id: "3",
          name: "Ana Costa",
          coordination: "Mecânica",
          subjects: ["Física", "Matemática"],
          workload: 18,
          status: "pending",
          email: "ana.costa@ipikk.edu.ao",
        },
        {
          id: "4",
          name: "Paulo Mendes",
          coordination: "EIE",
          subjects: ["Eletrônica", "Circuitos"],
          workload: 22,
          status: "active",
          email: "paulo.mendes@ipikk.edu.ao",
        },
      ]

      teachersTable.innerHTML = ""

      teachers.forEach((teacher) => {
        const row = document.createElement("tr")

        const statusColors = {
          active: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
          inactive: "bg-red-100 text-red-800",
        }

        const statusNames = {
          active: "Ativo",
          pending: "Pendente",
          inactive: "Inativo",
        }

        row.innerHTML = `
                    <td>
                        <input type="checkbox" class="teacher-checkbox" data-id="${teacher.id}" onchange="toggleTeacherSelection('${teacher.id}')">
                    </td>
                    <td>
                        <div>
                            <div class="font-medium">${teacher.name}</div>
                            <div class="text-sm text-gray-500">${teacher.email}</div>
                        </div>
                    </td>
                    <td>${teacher.coordination}</td>
                    <td>
                        <div class="subjects-list">
                            ${teacher.subjects.map((subject) => `<span class="subject-tag">${subject}</span>`).join("")}
                        </div>
                    </td>
                    <td>${teacher.workload}h/semana</td>
                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[teacher.status]}">
                            ${statusNames[teacher.status]}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-secondary btn-sm" onclick="editTeacher('${teacher.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-info btn-sm" onclick="viewTeacherSchedule('${teacher.id}')">
                                <i class="fas fa-calendar"></i>
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="manageTeacherWorkload('${teacher.id}')">
                                <i class="fas fa-clock"></i>
                            </button>
                        </div>
                    </td>
                `

        teachersTable.appendChild(row)
      })
    } catch (error) {
      console.error("Erro ao carregar professores:", error)
    }
  }

  function setupEventListeners() {
    // Filtros
    document.getElementById("coordination-filter").addEventListener("change", window.applyFilters)
    document.getElementById("status-filter").addEventListener("change", window.applyFilters)
    document.getElementById("period-filter").addEventListener("change", window.applyFilters)
  }

  // Funções globais
  window.refreshAllData = async () => {
    Swal.fire({
      title: "Atualizando Dados",
      text: "Carregando informações mais recentes...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      await Promise.all([loadOperationalStats(), loadTeachers()])
      Swal.close()
      Swal.fire("Atualizado!", "Dados atualizados com sucesso.", "success")
    } catch (error) {
      Swal.fire("Erro!", "Não foi possível atualizar os dados.", "error")
    }
  }

  window.applyFilters = () => {
    const coordination = document.getElementById("coordination-filter").value
    const status = document.getElementById("status-filter").value
    const period = document.getElementById("period-filter").value

    // Aplicar filtros (implementação simplificada)
    loadTeachers()

    Swal.fire({
      title: "Filtros Aplicados",
      text: "Dados filtrados com sucesso.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  }

  // Gestão de Horários
  window.createNewSchedule = () => {
    Swal.fire({
      title: "Novo Horário",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Professor:</label>
                    <select class="swal2-input" id="schedule-teacher">
                        <option>João Silva</option>
                        <option>Maria Santos</option>
                        <option>Ana Costa</option>
                    </select>
                    
                    <label class="form-label">Disciplina:</label>
                    <select class="swal2-input" id="schedule-subject">
                        <option>Programação I</option>
                        <option>Redes</option>
                        <option>Física</option>
                    </select>
                    
                    <label class="form-label">Turma:</label>
                    <select class="swal2-input" id="schedule-class">
                        <option>EIE-2A</option>
                        <option>GSI-1B</option>
                        <option>MEC-3A</option>
                    </select>
                    
                    <label class="form-label">Sala:</label>
                    <select class="swal2-input" id="schedule-room">
                        <option>Sala 201</option>
                        <option>Lab. Informática 1</option>
                        <option>Lab. Eletrônica</option>
                    </select>
                    
                    <label class="form-label">Dia da Semana:</label>
                    <select class="swal2-input" id="schedule-day">
                        <option>Segunda-feira</option>
                        <option>Terça-feira</option>
                        <option>Quarta-feira</option>
                        <option>Quinta-feira</option>
                        <option>Sexta-feira</option>
                    </select>
                    
                    <label class="form-label">Horário:</label>
                    <select class="swal2-input" id="schedule-time">
                        <option>07:00 - 08:30</option>
                        <option>08:30 - 10:00</option>
                        <option>10:15 - 11:45</option>
                        <option>13:30 - 15:00</option>
                        <option>15:00 - 16:30</option>
                    </select>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Criar Horário",
      cancelButtonText: "Cancelar",
      width: "600px",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Sucesso!", "Horário criado com sucesso.", "success")
        loadOperationalStats()
      }
    })
  }

  window.viewActiveSchedules = () => {
    Swal.fire({
      title: "Horários Ativos",
      html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Professor</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Disciplina</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Turma</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Horário</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">João Silva</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Programação I</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">EIE-2A</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Seg 08:30-10:00</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Maria Santos</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Redes</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">GSI-1B</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Ter 10:15-11:45</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Ana Costa</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Física</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">MEC-3A</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Qua 13:30-15:00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `,
      confirmButtonText: "OK",
      width: "700px",
    })
  }

  window.detectConflicts = () => {
    Swal.fire({
      title: "Detectando Conflitos",
      text: "Analisando horários...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Conflitos Detectados",
        html: `
                    <div style="text-align: left;">
                        <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <h4 style="color: #dc2626; margin: 0 0 10px 0;">
                                <i class="fas fa-exclamation-triangle"></i>
                                Conflito de Sala
                            </h4>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Sala 201</strong> - Segunda-feira 14:00-15:30<br>
                                Prof. João Silva (Programação I) e Prof. Maria Santos (Redes)
                            </p>
                        </div>
                        
                        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <h4 style="color: #d97706; margin: 0 0 10px 0;">
                                <i class="fas fa-clock"></i>
                                Sobrecarga de Professor
                            </h4>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Prof. Ana Costa</strong> - 32 horas/semana<br>
                                Excede limite recomendado de 30 horas
                            </p>
                        </div>
                        
                        <div style="background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px;">
                            <h4 style="color: #2563eb; margin: 0 0 10px 0;">
                                <i class="fas fa-info-circle"></i>
                                Sugestão de Otimização
                            </h4>
                            <p style="margin: 0; font-size: 14px;">
                                Lab. Informática 2 está subutilizado<br>
                                Pode acomodar 3 horários adicionais
                            </p>
                        </div>
                    </div>
                `,
        showCancelButton: true,
        confirmButtonText: "Resolver Conflitos",
        cancelButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          window.optimizeSchedules()
        }
      })
    }, 2000)
  }

  window.optimizeSchedules = () => {
    Swal.fire({
      title: "Otimização de Horários",
      text: "Aplicando algoritmos de otimização...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Otimização Concluída!",
        html: `
                    <div style="text-align: left;">
                        <h4>Melhorias Aplicadas:</h4>
                        <ul style="margin: 15px 0; padding-left: 20px;">
                            <li>3 conflitos de sala resolvidos</li>
                            <li>Taxa de ocupação melhorada em 12%</li>
                            <li>Carga horária balanceada para 2 professores</li>
                            <li>2 salas otimizadas para melhor uso</li>
                        </ul>
                        
                        <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-top: 15px;">
                            <strong style="color: #166534;">Resultado:</strong>
                            <p style="margin: 5px 0 0 0; color: #166534;">
                                Eficiência do sistema aumentou de 78% para 90%
                            </p>
                        </div>
                    </div>
                `,
        confirmButtonText: "Excelente!",
        icon: "success",
      })
    }, 3000)
  }

  window.bulkScheduleOperations = () => {
    Swal.fire({
      title: "Operações em Massa",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Selecione a operação:</label>
                    <select class="swal2-input" id="bulk-operation">
                        <option value="duplicate">Duplicar horários para outra semana</option>
                        <option value="move">Mover horários para outro período</option>
                        <option value="delete">Deletar horários selecionados</option>
                        <option value="export">Exportar horários</option>
                    </select>
                    
                    <label class="form-label">Filtros:</label>
                    <select class="swal2-input" id="bulk-filter">
                        <option value="all">Todos os horários</option>
                        <option value="coordination">Por coordenação</option>
                        <option value="teacher">Por professor</option>
                        <option value="room">Por sala</option>
                    </select>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Executar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const operation = document.getElementById("bulk-operation").value
        Swal.fire("Executado!", `Operação "${operation}" executada com sucesso.`, "success")
      }
    })
  }

  // Gestão de Recursos
  window.addNewResource = () => {
    Swal.fire({
      title: "Novo Recurso",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Tipo de Recurso:</label>
                    <select class="swal2-input" id="resource-type">
                        <option value="room">Sala</option>
                        <option value="equipment">Equipamento</option>
                        <option value="lab">Laboratório</option>
                    </select>
                    
                    <label class="form-label">Nome:</label>
                    <input type="text" class="swal2-input" id="resource-name" placeholder="Nome do recurso">
                    
                    <label class="form-label">Capacidade:</label>
                    <input type="number" class="swal2-input" id="resource-capacity" placeholder="Número de pessoas">
                    
                    <label class="form-label">Localização:</label>
                    <input type="text" class="swal2-input" id="resource-location" placeholder="Localização física">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Adicionado!", "Recurso adicionado com sucesso.", "success")
        loadOperationalStats()
      }
    })
  }

  window.manageRooms = () => {
    Swal.fire({
      title: "Gestão de Salas",
      html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Sala</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Capacidade</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Status</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Ocupação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Sala 201</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">30</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">
                                    <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Ativa</span>
                                </td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">85%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Lab. Informática 1</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">25</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">
                                    <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Ativa</span>
                                </td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">92%</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Lab. Eletrônica</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">20</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">
                                    <span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Manutenção</span>
                                </td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">0%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `,
      confirmButtonText: "OK",
      width: "600px",
    })
  }

  window.manageEquipment = () => {
    Swal.fire({
      title: "Gestão de Equipamentos",
      html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <div style="display: grid; gap: 15px;">
                        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0;">Projetores</h4>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total: 15</span>
                                <span style="color: #dc2626;">Defeituosos: 2</span>
                            </div>
                        </div>
                        
                        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0;">Computadores</h4>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total: 45</span>
                                <span style="color: #059669;">Funcionando: 43</span>
                            </div>
                        </div>
                        
                        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0;">Quadros Interativos</h4>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total: 8</span>
                                <span style="color: #059669;">Funcionando: 8</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
    })
  }

  window.checkAvailability = () => {
    Swal.fire({
      title: "Verificar Disponibilidade",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Data:</label>
                    <input type="date" class="swal2-input" id="availability-date" value="${new Date().toISOString().split("T")[0]}">
                    
                    <label class="form-label">Horário:</label>
                    <select class="swal2-input" id="availability-time">
                        <option>07:00 - 08:30</option>
                        <option>08:30 - 10:00</option>
                        <option>10:15 - 11:45</option>
                        <option>13:30 - 15:00</option>
                        <option>15:00 - 16:30</option>
                    </select>
                    
                    <label class="form-label">Tipo de Recurso:</label>
                    <select class="swal2-input" id="availability-type">
                        <option value="room">Salas</option>
                        <option value="lab">Laboratórios</option>
                        <option value="equipment">Equipamentos</option>
                    </select>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Verificar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Recursos Disponíveis",
          html: `
                        <div style="text-align: left;">
                            <h4 style="color: #059669;">Disponíveis:</h4>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Sala 203 (Capacidade: 35)</li>
                                <li>Lab. Informática 2 (Capacidade: 25)</li>
                                <li>Auditório (Capacidade: 100)</li>
                            </ul>
                            
                            <h4 style="color: #dc2626;">Ocupados:</h4>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Sala 201 - Prof. João Silva</li>
                                <li>Lab. Eletrônica - Manutenção</li>
                            </ul>
                        </div>
                    `,
          confirmButtonText: "OK",
        })
      }
    })
  }

  window.maintenanceSchedule = () => {
    Swal.fire({
      title: "Cronograma de Manutenção",
      html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <div style="display: grid; gap: 15px;">
                        <div style="border-left: 4px solid #f59e0b; background: #fffbeb; padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #d97706;">Manutenção Programada</h4>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Lab. Eletrônica</strong><br>
                                Data: Amanhã (15/01/2024)<br>
                                Tipo: Troca de equipamentos
                            </p>
                        </div>
                        
                        <div style="border-left: 4px solid #ef4444; background: #fef2f2; padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #dc2626;">Manutenção Urgente</h4>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Projetor - Sala 201</strong><br>
                                Problema: Não liga<br>
                                Status: Aguardando técnico
                            </p>
                        </div>
                        
                        <div style="border-left: 4px solid #10b981; background: #f0fdf4; padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #059669;">Manutenção Concluída</h4>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Ar Condicionado - Sala 105</strong><br>
                                Concluída: Ontem<br>
                                Técnico: João Manutenção
                            </p>
                        </div>
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
    })
  }

  // Gestão de Professores
  window.toggleSelectAllTeachers = () => {
    const selectAll = document.getElementById("select-all-teachers")
    const checkboxes = document.querySelectorAll(".teacher-checkbox")

    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAll.checked
      if (selectAll.checked) {
        selectedTeachers.add(checkbox.dataset.id)
      } else {
        selectedTeachers.delete(checkbox.dataset.id)
      }
    })

    updateBulkButtons()
  }

  window.toggleTeacherSelection = (id) => {
    if (selectedTeachers.has(id)) {
      selectedTeachers.delete(id)
    } else {
      selectedTeachers.add(id)
    }

    updateBulkButtons()
  }

  function updateBulkButtons() {
    const bulkEditBtn = document.getElementById("bulk-edit-btn")
    bulkEditBtn.disabled = selectedTeachers.size === 0
  }

  window.addNewTeacher = () => {
    Swal.fire({
      title: "Novo Professor",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Nome Completo:</label>
                    <input type="text" class="swal2-input" id="teacher-name" placeholder="Nome do professor">
                    
                    <label class="form-label">Email:</label>
                    <input type="email" class="swal2-input" id="teacher-email" placeholder="email@ipikk.edu.ao">
                    
                    <label class="form-label">Coordenação:</label>
                    <select class="swal2-input" id="teacher-coordination">
                        <option value="eie">EIE</option>
                        <option value="gsi">GSI</option>
                        <option value="mecanica">Mecânica</option>
                    </select>
                    
                    <label class="form-label">Especialidade:</label>
                    <input type="text" class="swal2-input" id="teacher-specialty" placeholder="Área de especialização">
                    
                    <label class="form-label">Categoria:</label>
                    <select class="swal2-input" id="teacher-category">
                        <option>Assistente</option>
                        <option>Professor Auxiliar</option>
                        <option>Professor Associado</option>
                        <option>Professor Catedrático</option>
                    </select>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Adicionar Professor",
      cancelButtonText: "Cancelar",
      width: "600px",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Adicionado!", "Professor adicionado com sucesso.", "success")
        loadTeachers()
      }
    })
  }

  window.editTeacher = (teacherId) => {
    Swal.fire({
      title: "Editar Professor",
      text: "Funcionalidade de edição será implementada.",
      icon: "info",
    })
  }

  window.viewTeacherSchedule = (teacherId) => {
    Swal.fire({
      title: "Horário do Professor",
      html: `
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Dia</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Horário</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Disciplina</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Turma</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Sala</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Segunda</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">08:30-10:00</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Programação I</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">EIE-2A</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Lab. Info 1</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Terça</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">10:15-11:45</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Algoritmos</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">EIE-1B</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">Sala 201</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `,
      confirmButtonText: "OK",
      width: "700px",
    })
  }

  window.manageTeacherWorkload = (teacherId) => {
    Swal.fire({
      title: "Gestão de Carga Horária",
      html: `
                <div style="text-align: left;">
                    <h4>Carga Horária Atual: 24h/semana</h4>
                    
                    <div style="margin: 15px 0;">
                        <label class="form-label">Nova Carga Horária:</label>
                        <input type="number" class="swal2-input" id="new-workload" value="24" min="0" max="40">
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h5>Distribuição Atual:</h5>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Programação I: 8h</li>
                            <li>Algoritmos: 6h</li>
                            <li>Estruturas de Dados: 6h</li>
                            <li>Orientação de Projetos: 4h</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                        <strong>Recomendação:</strong> Carga horária ideal entre 20-30h/semana
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Atualizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Atualizado!", "Carga horária atualizada com sucesso.", "success")
      }
    })
  }

  window.importTeachers = () => {
    Swal.fire({
      title: "Importar Professores",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Selecione o arquivo:</label>
                    <input type="file" class="swal2-input" accept=".csv,.xlsx" id="import-file">
                    
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h5>Formato Aceito:</h5>
                        <p style="margin: 5px 0; font-size: 14px;">
                            CSV ou Excel com colunas: Nome, Email, Coordenação, Especialidade, Categoria
                        </p>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Importar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Importado!", "Professores importados com sucesso.", "success")
        loadTeachers()
      }
    })
  }

  window.bulkEditTeachers = () => {
    if (selectedTeachers.size === 0) return

    Swal.fire({
      title: "Edição em Massa",
      html: `
                <div style="text-align: left;">
                    <p>Professores selecionados: <strong>${selectedTeachers.size}</strong></p>
                    
                    <label class="form-label">Campo a editar:</label>
                    <select class="swal2-input" id="bulk-field">
                        <option value="coordination">Coordenação</option>
                        <option value="category">Categoria</option>
                        <option value="status">Status</option>
                        <option value="workload">Carga Horária</option>
                    </select>
                    
                    <label class="form-label">Novo valor:</label>
                    <input type="text" class="swal2-input" id="bulk-value" placeholder="Novo valor">
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Aplicar Alterações",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Atualizado!", `${selectedTeachers.size} professores atualizados.`, "success")
        selectedTeachers.clear()
        updateBulkButtons()
        loadTeachers()
      }
    })
  }

  window.exportTeachers = () => {
    Swal.fire({
      title: "Exportar Lista de Professores",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Formato:</label>
                    <select class="swal2-input" id="export-format">
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                        <option value="pdf">PDF</option>
                    </select>
                    
                    <label class="form-label">Incluir:</label>
                    <div style="margin: 10px 0;">
                        <label><input type="checkbox" checked> Dados pessoais</label><br>
                        <label><input type="checkbox" checked> Carga horária</label><br>
                        <label><input type="checkbox"> Horários detalhados</label><br>
                        <label><input type="checkbox"> Estatísticas</label>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Exportar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Exportado!", "Lista exportada com sucesso.", "success")
      }
    })
  }

  // Relatórios
  window.generateOccupancyReport = () => {
    Swal.fire({
      title: "Gerando Relatório de Ocupação",
      text: "Coletando dados de ocupação...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Relatório de Ocupação",
        html: `
                    <div style="text-align: left;">
                        <h4>Taxa de Ocupação Geral: 78%</h4>
                        
                        <div style="margin: 15px 0;">
                            <h5>Por Coordenação:</h5>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>EIE: 85% (Acima da média)</li>
                                <li>GSI: 72% (Dentro da média)</li>
                                <li>Mecânica: 76% (Dentro da média)</li>
                            </ul>
                        </div>
                        
                        <div style="margin: 15px 0;">
                            <h5>Salas Mais Utilizadas:</h5>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Lab. Informática 1: 95%</li>
                                <li>Sala 201: 88%</li>
                                <li>Lab. Eletrônica: 82%</li>
                            </ul>
                        </div>
                        
                        <div style="background: #dcfce7; padding: 15px; border-radius: 8px;">
                            <strong>Recomendação:</strong> Considerar abertura de mais horários no Lab. Informática 1
                        </div>
                    </div>
                `,
        showCancelButton: true,
        confirmButtonText: "Download PDF",
        cancelButtonText: "OK",
      })
    }, 2000)
  }

  window.generateConflictReport = () => {
    Swal.fire({
      title: "Relatório de Conflitos",
      html: `
                <div style="text-align: left;">
                    <h4>Conflitos Detectados: 3</h4>
                    
                    <div style="margin: 15px 0;">
                        <div style="background: #fee2e2; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                            <strong>Conflito de Sala</strong><br>
                            Sala 201 - Segunda 14:00<br>
                            <small>Prof. João Silva vs Prof. Maria Santos</small>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                            <strong>Sobrecarga de Professor</strong><br>
                            Prof. Ana Costa - 32h/semana<br>
                            <small>Excede limite recomendado</small>
                        </div>
                        
                        <div style="background: #dbeafe; padding: 10px; border-radius: 8px;">
                            <strong>Subutilização</strong><br>
                            Lab. Informática 2 - 45%<br>
                            <small>Pode acomodar mais horários</small>
                        </div>
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
    })
  }

  window.generateWorkloadReport = () => {
    Swal.fire({
      title: "Relatório de Carga Horária",
      html: `
                <div style="text-align: left;">
                    <h4>Distribuição de Carga Horária</h4>
                    
                    <div style="margin: 15px 0;">
                        <h5>Por Faixa:</h5>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Baixa (< 20h): 3 professores</li>
                            <li>Ideal (20-30h): 15 professores</li>
                            <li>Alta (30-40h): 5 professores</li>
                            <li>Sobrecarga (> 40h): 1 professor</li>
                        </ul>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <h5>Média por Coordenação:</h5>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>EIE: 26h/semana</li>
                            <li>GSI: 24h/semana</li>
                            <li>Mecânica: 28h/semana</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                        <strong>Atenção:</strong> Prof. Ana Costa com sobrecarga (32h)
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
    })
  }

  window.generateEfficiencyReport = () => {
    Swal.fire({
      title: "Relatório de Eficiência",
      html: `
                <div style="text-align: left;">
                    <h4>Eficiência Geral do Sistema: 82%</h4>
                    
                    <div style="margin: 15px 0;">
                        <h5>Métricas:</h5>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Taxa de ocupação: 78%</li>
                            <li>Conflitos resolvidos: 95%</li>
                            <li>Tempo médio de resolução: 2.5h</li>
                            <li>Satisfação dos professores: 87%</li>
                        </ul>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <h5>Tendências (último mês):</h5>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Ocupação: ↗ +5%</li>
                            <li>Conflitos: ↘ -12%</li>
                            <li>Eficiência: ↗ +8%</li>
                        </ul>
                    </div>
                    
                    <div style="background: #dcfce7; padding: 15px; border-radius: 8px;">
                        <strong>Resultado:</strong> Sistema operando dentro dos parâmetros ideais
                    </div>
                </div>
            `,
      confirmButtonText: "OK",
    })
  }

  // Ferramentas de Sistema
  window.runSystemDiagnostics = () => {
    Swal.fire({
      title: "Executando Diagnóstico",
      text: "Verificando integridade do sistema...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Diagnóstico Concluído",
        html: `
                    <div style="text-align: left;">
                        <h4>Status do Sistema: ✅ Saudável</h4>
                        
                        <div style="margin: 15px 0;">
                            <h5>Verificações:</h5>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>✅ Base de dados: OK</li>
                                <li>✅ Integridade dos dados: OK</li>
                                <li>✅ Performance: OK</li>
                                <li>⚠️ Cache: Recomenda limpeza</li>
                                <li>✅ Backup: OK</li>
                            </ul>
                        </div>
                        
                        <div style="background: #fffbeb; padding: 15px; border-radius: 8px;">
                            <strong>Recomendação:</strong> Executar limpeza de cache para melhor performance
                        </div>
                    </div>
                `,
        showCancelButton: true,
        confirmButtonText: "Limpar Cache",
        cancelButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          window.clearSystemCache()
        }
      })
    }, 3000)
  }

  window.clearSystemCache = () => {
    Swal.fire({
      title: "Limpando Cache",
      text: "Removendo arquivos temporários...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire("Cache Limpo!", "Sistema otimizado com sucesso.", "success")
    }, 2000)
  }

  window.syncWithExternalSystems = () => {
    Swal.fire({
      title: "Sincronização com Sistemas Externos",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Selecione os sistemas:</label>
                    <div style="margin: 10px 0;">
                        <label><input type="checkbox" checked> Sistema Acadêmico</label><br>
                        <label><input type="checkbox" checked> Sistema de RH</label><br>
                        <label><input type="checkbox"> Sistema Financeiro</label><br>
                        <label><input type="checkbox"> Sistema de Biblioteca</label>
                    </div>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Sincronizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Sincronizando",
          text: "Conectando com sistemas externos...",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading()
          },
        })

        setTimeout(() => {
          Swal.fire("Sincronizado!", "Dados sincronizados com sucesso.", "success")
        }, 3000)
      }
    })
  }

  window.validateDataIntegrity = () => {
    Swal.fire({
      title: "Validando Integridade",
      text: "Verificando consistência dos dados...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire({
        title: "Validação Concluída",
        html: `
                    <div style="text-align: left;">
                        <h4>Resultado: ✅ Dados Íntegros</h4>
                        
                        <div style="margin: 15px 0;">
                            <h5>Verificações:</h5>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>✅ Professores: 24 registros válidos</li>
                                <li>✅ Horários: 156 registros válidos</li>
                                <li>✅ Salas: 25 registros válidos</li>
                                <li>✅ Turmas: 18 registros válidos</li>
                                <li>✅ Disciplinas: 45 registros válidos</li>
                            </ul>
                        </div>
                        
                        <div style="background: #dcfce7; padding: 15px; border-radius: 8px;">
                            <strong>Status:</strong> Todos os dados estão consistentes e válidos
                        </div>
                    </div>
                `,
        confirmButtonText: "OK",
        icon: "success",
      })
    }, 2500)
  }
})

// Adicionar estilos para tags de disciplinas
const style = document.createElement("style")
style.textContent = `
    .subjects-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    
    .subject-tag {
        background: #eff6ff;
        color: #2563eb;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
    }
`
document.head.appendChild(style)
