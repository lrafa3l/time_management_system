import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  const firebase = window.firebase
  const Swal = window.Swal

  let db = null
  const charts = {}
  let currentTimeframe = "weekly"

  // Verificar autenticação e permissões
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get()
    if (!userDoc.exists || userDoc.data().role !== "director") {
      Swal.fire({
        title: "Acesso Negado!",
        text: "Você não tem permissão para acessar esta página.",
        icon: "error",
      }).then(() => {
        window.location.href = "/main.html"
      })
      return
    }

    db = firebase.firestore()
    await initializeReports()
  })

  async function initializeReports() {
    try {
      await Promise.all([loadCoordinations(), loadKPIs(), loadCharts(), loadTables()])

      setupEventListeners()
    } catch (error) {
      console.error("Erro ao inicializar relatórios:", error)
      Swal.fire("Erro!", "Não foi possível carregar os relatórios.", "error")
    }
  }

  async function loadCoordinations() {
    try {
      const coordSnapshot = await db.collection("coordenacoes").get()
      const select = document.getElementById("coordination-filter")

      coordSnapshot.forEach((doc) => {
        const option = document.createElement("option")
        option.value = doc.id
        option.textContent = doc.data().nome
        select.appendChild(option)
      })
    } catch (error) {
      console.error("Erro ao carregar coordenações:", error)
    }
  }

  async function loadKPIs() {
    try {
      const [professoresSnapshot, horariosSnapshot, salasSnapshot] = await Promise.all([
        db.collection("professores").where("ativo", "==", true).get(),
        db.collection("horarios").get(),
        db.collection("salas").get(),
      ])

      // Calcular taxa de ocupação
      const totalSlots = salasSnapshot.size * 5 * 8 // salas * dias * períodos
      const occupiedSlots = horariosSnapshot.size
      const occupancyRate = ((occupiedSlots / totalSlots) * 100).toFixed(1)

      // Calcular horas lecionadas
      const totalHours = horariosSnapshot.docs.reduce((total, doc) => {
        const horario = doc.data()
        return total + (horario.cargaHoraria || 2)
      }, 0)

      // Atualizar KPIs
      document.getElementById("occupancy-rate").textContent = occupancyRate + "%"
      document.getElementById("total-hours").textContent = totalHours + "h"
      document.getElementById("active-teachers").textContent = professoresSnapshot.size
      document.getElementById("conflicts-resolved").textContent = "12" // Mock data

      // Simular mudanças (em um sistema real, comparar com período anterior)
      updateKPIChanges()
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error)
    }
  }

  function updateKPIChanges() {
    // Mock data para demonstração
    const changes = [
      { id: "occupancy-change", value: "+5.2%", type: "positive" },
      { id: "hours-change", value: "+12.5%", type: "positive" },
      { id: "teachers-change", value: "0%", type: "neutral" },
      { id: "conflicts-change", value: "-8.3%", type: "positive" },
    ]

    changes.forEach((change) => {
      const element = document.getElementById(change.id)
      element.textContent = change.value
      element.className = `stat-change ${change.type}`
    })
  }

  async function loadCharts() {
    await Promise.all([createOccupancyChart(), createWorkloadChart(), createTrendsChart()])
  }

  async function createOccupancyChart() {
    try {
      const coordSnapshot = await db.collection("coordenacoes").get()
      const horariosSnapshot = await db.collection("horarios").get()

      const coordData = {}
      coordSnapshot.forEach((doc) => {
        coordData[doc.id] = { nome: doc.data().nome, count: 0 }
      })

      // Contar horários por coordenação
      for (const horarioDoc of horariosSnapshot.docs) {
        const horario = horarioDoc.data()
        const professorDoc = await db.collection("professores").doc(horario.professorId).get()

        if (professorDoc.exists) {
          const coordenacao = professorDoc.data().coordenacao
          if (coordData[coordenacao]) {
            coordData[coordenacao].count++
          }
        }
      }

      const labels = Object.values(coordData).map((coord) => coord.nome)
      const data = Object.values(coordData).map((coord) => coord.count)

      const ctx = document.getElementById("occupancy-chart").getContext("2d")
      charts.occupancy = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Horários Ativos",
              data: data,
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    } catch (error) {
      console.error("Erro ao criar gráfico de ocupação:", error)
    }
  }

  async function createWorkloadChart() {
    try {
      // Mock data para distribuição de carga
      const workloadData = {
        "Baixa (< 20h)": 15,
        "Média (20-30h)": 25,
        "Alta (30-40h)": 12,
        "Sobrecarga (> 40h)": 3,
      }

      const ctx = document.getElementById("workload-chart").getContext("2d")
      charts.workload = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(workloadData),
          datasets: [
            {
              data: Object.values(workloadData),
              backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
              borderColor: ["#059669", "#2563EB", "#D97706", "#DC2626"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      })
    } catch (error) {
      console.error("Erro ao criar gráfico de carga:", error)
    }
  }

  async function createTrendsChart() {
    try {
      // Mock data para tendências
      const trendsData = {
        labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"],
        datasets: [
          {
            label: "Taxa de Ocupação (%)",
            data: [65, 72, 68, 75, 78, 82],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
          {
            label: "Conflitos",
            data: [8, 6, 9, 4, 3, 2],
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
        ],
      }

      const ctx = document.getElementById("trends-chart").getContext("2d")
      charts.trends = new Chart(ctx, {
        type: "line",
        data: trendsData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    } catch (error) {
      console.error("Erro ao criar gráfico de tendências:", error)
    }
  }

  async function loadTables() {
    await Promise.all([loadTopTeachers(), loadTopRooms()])
  }

  async function loadTopTeachers() {
    try {
      const professoresSnapshot = await db.collection("professores").where("ativo", "==", true).limit(10).get()

      const tableBody = document.getElementById("top-teachers-table")
      tableBody.innerHTML = ""

      if (professoresSnapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum professor encontrado</td></tr>'
        return
      }

      for (const doc of professoresSnapshot.docs) {
        const professor = doc.data()

        // Calcular horas (mock data)
        const horasSemanais = Math.floor(Math.random() * 30) + 10
        const eficiencia = Math.floor(Math.random() * 20) + 80

        const row = document.createElement("tr")
        row.innerHTML = `
                    <td>
                        <div class="font-medium">${professor.nome}</div>
                        <div class="text-sm text-gray-500">${professor.email}</div>
                    </td>
                    <td>${professor.coordenacao || "N/A"}</td>
                    <td>${horasSemanais}h</td>
                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eficiencia >= 90 ? "bg-green-100 text-green-800" : eficiencia >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}">
                            ${eficiencia}%
                        </span>
                    </td>
                `
        tableBody.appendChild(row)
      }
    } catch (error) {
      console.error("Erro ao carregar top professores:", error)
    }
  }

  async function loadTopRooms() {
    try {
      // Mock data para salas mais utilizadas
      const roomsData = [
        { nome: "Lab. Informática 1", tipo: "Laboratório", ocupacao: 95, status: "Ativa" },
        { nome: "Sala 201", tipo: "Teórica", ocupacao: 88, status: "Ativa" },
        { nome: "Lab. Eletrônica", tipo: "Laboratório", ocupacao: 82, status: "Ativa" },
        { nome: "Auditório", tipo: "Especial", ocupacao: 75, status: "Ativa" },
        { nome: "Sala 105", tipo: "Teórica", ocupacao: 70, status: "Manutenção" },
      ]

      const tableBody = document.getElementById("top-rooms-table")
      tableBody.innerHTML = ""

      roomsData.forEach((room) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                    <td>
                        <div class="font-medium">${room.nome}</div>
                    </td>
                    <td>${room.tipo}</td>
                    <td>
                        <div class="flex items-center">
                            <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${room.ocupacao}%"></div>
                            </div>
                            <span class="text-sm">${room.ocupacao}%</span>
                        </div>
                    </td>
                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === "Ativa" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">
                            ${room.status}
                        </span>
                    </td>
                `
        tableBody.appendChild(row)
      })
    } catch (error) {
      console.error("Erro ao carregar top salas:", error)
    }
  }

  function setupEventListeners() {
    // Filtro de período
    document.getElementById("period-filter").addEventListener("change", function () {
      const customDates = document.getElementById("custom-dates")
      if (this.value === "custom") {
        customDates.style.display = "block"
      } else {
        customDates.style.display = "none"
      }
      window.refreshReports()
    })

    // Filtro de coordenação
    document.getElementById("coordination-filter").addEventListener("change", window.refreshReports)

    // Datas personalizadas
    document.getElementById("start-date").addEventListener("change", window.refreshReports)
    document.getElementById("end-date").addEventListener("change", window.refreshReports)
  }

  // Funções globais
  window.refreshReports = async () => {
    try {
      Swal.fire({
        title: "Atualizando Relatórios",
        text: "Carregando dados mais recentes...",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        },
      })

      await Promise.all([loadKPIs(), loadCharts(), loadTables()])

      Swal.close()
    } catch (error) {
      console.error("Erro ao atualizar relatórios:", error)
      Swal.fire("Erro!", "Não foi possível atualizar os relatórios.", "error")
    }
  }

  window.exportChart = (chartId) => {
    const canvas = document.getElementById(chartId)
    const url = canvas.toDataURL("image/png")

    const link = document.createElement("a")
    link.download = `${chartId}_${new Date().toISOString().split("T")[0]}.png`
    link.href = url
    link.click()
  }

  window.exportAllReports = () => {
    Swal.fire({
      title: "Exportar Relatórios",
      text: "Escolha o formato de exportação:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "PDF",
      cancelButtonText: "Excel",
      showDenyButton: true,
      denyButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        exportToPDF()
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        exportToExcel()
      }
    })
  }

  window.changeTimeframe = (timeframe) => {
    currentTimeframe = timeframe

    // Atualizar botões
    document.querySelectorAll('[onclick^="changeTimeframe"]').forEach((btn) => {
      btn.className = "btn btn-secondary"
    })
    event.target.className = "btn btn-primary"

    // Recriar gráfico de tendências
    createTrendsChart()
  }

  window.generateDetailedReport = (type) => {
    const reportTypes = {
      occupancy: "Relatório de Ocupação de Salas",
      teachers: "Relatório de Desempenho dos Professores",
      efficiency: "Relatório de Eficiência Operacional",
      conflicts: "Relatório de Conflitos e Resoluções",
      financial: "Relatório de Custos Operacionais",
      custom: "Relatório Personalizado",
    }

    if (type === "custom") {
      showCustomReportDialog()
    } else {
      Swal.fire({
        title: "Gerar Relatório",
        text: `Deseja gerar o ${reportTypes[type]}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Gerar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          generateReport(type)
        }
      })
    }
  }

  function showCustomReportDialog() {
    Swal.fire({
      title: "Relatório Personalizado",
      html: `
                <div style="text-align: left;">
                    <label class="form-label">Métricas a incluir:</label>
                    <div style="margin: 10px 0;">
                        <label><input type="checkbox" checked> Taxa de Ocupação</label><br>
                        <label><input type="checkbox" checked> Carga Horária dos Professores</label><br>
                        <label><input type="checkbox"> Utilização de Salas</label><br>
                        <label><input type="checkbox"> Conflitos de Horário</label><br>
                        <label><input type="checkbox"> Análise Financeira</label>
                    </div>
                    <label class="form-label">Período:</label>
                    <select class="swal2-input">
                        <option>Última Semana</option>
                        <option>Último Mês</option>
                        <option>Último Semestre</option>
                    </select>
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Gerar Relatório",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        generateReport("custom")
      }
    })
  }

  function generateReport(type) {
    Swal.fire({
      title: "Gerando Relatório",
      text: "Processando dados e criando documento...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    // Simular geração de relatório
    setTimeout(() => {
      Swal.fire({
        title: "Relatório Gerado!",
        text: "O relatório foi gerado com sucesso.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Download",
        cancelButtonText: "Visualizar",
      }).then((result) => {
        if (result.isConfirmed) {
          // Simular download
          const link = document.createElement("a")
          link.download = `relatorio_${type}_${new Date().toISOString().split("T")[0]}.pdf`
          link.href = "#"
          link.click()
        }
      })
    }, 3000)
  }

  function exportToPDF() {
    Swal.fire({
      title: "Exportando para PDF",
      text: "Gerando documento PDF...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire("Sucesso!", "Relatório exportado para PDF.", "success")
    }, 2000)
  }

  function exportToExcel() {
    Swal.fire({
      title: "Exportando para Excel",
      text: "Gerando planilha Excel...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading()
      },
    })

    setTimeout(() => {
      Swal.fire("Sucesso!", "Relatório exportado para Excel.", "success")
    }, 2000)
  }
})
