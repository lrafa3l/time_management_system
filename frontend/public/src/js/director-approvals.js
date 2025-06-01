document.addEventListener("DOMContentLoaded", () => {
  const firebase = window.firebase;
  const Swal = window.Swal;

  let db = null;
  let currentUser = null;
  let allApprovals = [];
  let filteredApprovals = [];
  const selectedApprovals = new Set();
  let currentApproval = null;

  // Verificar autenticação e permissões
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "director") {
      Swal.fire({
        title: "Acesso Negado!",
        text: "Você não tem permissão para acessar esta página.",
        icon: "error",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          text: "my-swal-text",
          confirmButton: "my-swal-confirm-button",
          cancelButton: "my-swal-cancel-button",
        },
      }).then(() => {
        window.location.href = "/main.html";
      });
      return;
    }

    currentUser = user;
    db = firebase.firestore();
    await initializeApprovals();
  });

  async function initializeApprovals() {
    try {
      await Promise.all([loadCoordinations(), loadApprovals(), loadStats(), loadHistory()]);

      setupEventListeners();
    } catch (error) {
      console.error("Erro ao inicializar aprovações:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível carregar as aprovações.",
        icon: "error",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          text: "my-swal-text",
          confirmButton: "my-swal-confirm-button",
          cancelButton: "my-swal-cancel-button",
        },
      });
    }
  }

  async function loadCoordinations() {
    try {
      const coordSnapshot = await db.collection("coordenacoes").get();
      const select = document.getElementById("coordination-filter");

      coordSnapshot.forEach((doc) => {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.data().nome;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar coordenações:", error);
    }
  }

  async function loadApprovals() {
    try {
      // Carregar solicitações pendentes (mock data para demonstração)
      allApprovals = [
        {
          id: "1",
          type: "schedule",
          title: "Novo Horário - Prof. João Silva",
          description: "Solicitação de criação de horário para disciplina de Programação I",
          requester: "Ezequiel Mazezela",
          requesterId: "coord1",
          coordination: "EIE",
          priority: "high",
          status: "pending",
          createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
          details: {
            professor: "João Silva",
            disciplina: "Programação I",
            turma: "EIE-2A",
            cargaHoraria: 4,
            periodo: "Manhã",
          },
        },
        {
          id: "2",
          type: "teacher",
          title: "Cadastro de Novo Professor",
          description: "Solicitação de cadastro do professor Maria Santos",
          requester: "Paulo Dala",
          requesterId: "coord2",
          coordination: "GSI",
          priority: "medium",
          status: "pending",
          createdAt: new Date(Date.now() - 172800000), // 2 dias atrás
          details: {
            nome: "Maria Santos",
            email: "maria.santos@ipikk.edu.ao",
            especialidade: "Redes de Computadores",
            categoria: "Assistente",
          },
        },
        {
          id: "3",
          type: "room",
          title: "Alteração de Sala",
          description: "Solicitação de mudança de sala para laboratório",
          requester: "Paulo Diassilua",
          requesterId: "coord3",
          coordination: "INF",
          priority: "low",
          status: "pending",
          createdAt: new Date(Date.now() - 259200000), // 3 dias atrás
          details: {
            salaAtual: "Sala 13",
            salaNova: "Lab. Informática 2",
            motivo: "Necessidade de computadores para aula prática",
            disciplina: "Técnicas de Linguagens de Programação",
          },
        },
      ];

      filteredApprovals = [...allApprovals];
      renderApprovals();
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error);
    }
  }

  function renderApprovals() {
    const container = document.getElementById("approvals-container");
    container.innerHTML = "";

    if (filteredApprovals.length === 0) {
      container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>Nenhuma solicitação encontrada</h3>
                    <p>Não há solicitações pendentes no momento.</p>
                </div>
            `;
      return;
    }

    filteredApprovals.forEach((approval) => {
      const approvalCard = createApprovalCard(approval);
      container.appendChild(approvalCard);
    });
  }

  function createApprovalCard(approval) {
    const card = document.createElement("div");
    card.className = "approval-card";
    card.style.cssText = `
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            padding: 20px;
            margin-bottom: 15px;
            background: white;
            transition: all 0.3s;
        `;

    const priorityColors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    const priorityNames = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };

    const typeIcons = {
      schedule: "fas fa-calendar",
      teacher: "fas fa-user-plus",
      room: "fas fa-door-open",
      system: "fas fa-cog",
    };

    const typeNames = {
      schedule: "Horário",
      teacher: "Professor",
      room: "Sala",
      system: "Sistema",
    };

    const timeAgo = getTimeAgo(approval.createdAt);

    card.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 15px;">
                <input type="checkbox" 
                       class="approval-checkbox" 
                       data-id="${approval.id}"
                       onchange="toggleApprovalSelection('${approval.id}')"
                       style="margin-top: 5px;">
                
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="${typeIcons[approval.type]}" style="color: var(--primary-blue);"></i>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[approval.priority]}">
                            ${priorityNames[approval.priority]}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${typeNames[approval.type]}
                        </span>
                        <span style="color: var(--text-secondary); font-size: 12px;">${timeAgo}</span>
                    </div>
                    
                    <h3 style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 16px;">
                        ${approval.title}
                    </h3>
                    
                    <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 14px;">
                        ${approval.description}
                    </p>
                    
                    <div style="display: flex; align-items: center; gap: 15px; font-size: 12px; color: var(--text-secondary);">
                        <span><strong>Solicitante:</strong> ${approval.requester}</span>
                        <span><strong>Coordenação:</strong> ${approval.coordination}</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn btn-secondary" onclick="viewApprovalDetails('${approval.id}')" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-eye"></i>
                        Detalhes
                    </button>
                    <button class="btn btn-success" onclick="quickApprove('${approval.id}')" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-check"></i>
                        Aprovar
                    </button>
                    <button class="btn btn-danger" onclick="quickReject('${approval.id}')" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-times"></i>
                        Rejeitar
                    </button>
                </div>
            </div>
        `;

    return card;
  }

  function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} dia${days > 1 ? "s" : ""} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? "s" : ""} atrás`;
    return "Agora mesmo";
  }

  async function loadStats() {
    try {
      const pendingCount = allApprovals.filter((a) => a.status === "pending").length;
      const approvedToday = 5; // Mock data
      const rejectedCount = 2; // Mock data
      const avgTime = "2.5h"; // Mock data

      document.getElementById("pending-count").textContent = pendingCount;
      document.getElementById("approved-today").textContent = approvedToday;
      document.getElementById("rejected-count").textContent = rejectedCount;
      document.getElementById("avg-time").textContent = avgTime;
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }

  async function loadHistory() {
    try {
      // Mock data para histórico
      const historyData = [
        {
          date: new Date(),
          type: "Horário",
          requester: "João Silva",
          action: "Aprovado",
          status: "approved",
        },
        {
          date: new Date(Date.now() - 3600000),
          type: "Professor",
          requester: "Maria Santos",
          action: "Rejeitado",
          status: "rejected",
        },
        {
          date: new Date(Date.now() - 7200000),
          type: "Sala",
          requester: "Ana Costa",
          action: "Aprovado",
          status: "approved",
        },
      ];

      const tableBody = document.getElementById("history-table");
      tableBody.innerHTML = "";

      historyData.forEach((item) => {
        const row = document.createElement("tr");
        const statusClass = item.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

        row.innerHTML = `
                    <td>${item.date.toLocaleString("pt-BR")}</td>
                    <td>${item.type}</td>
                    <td>${item.requester}</td>
                    <td>${item.action}</td>
                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                            ${item.status === "approved" ? "Aprovado" : "Rejeitado"}
                        </span>
                    </td>
                `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }

  function setupEventListeners() {
    // Filtros
    document.getElementById("type-filter").addEventListener("change", applyFilters);
    document.getElementById("coordination-filter").addEventListener("change", applyFilters);
    document.getElementById("priority-filter").addEventListener("change", applyFilters);
    document.getElementById("status-filter").addEventListener("change", applyFilters);
  }

  function applyFilters() {
    const typeFilter = document.getElementById("type-filter").value;
    const coordFilter = document.getElementById("coordination-filter").value;
    const priorityFilter = document.getElementById("priority-filter").value;
    const statusFilter = document.getElementById("status-filter").value;

    filteredApprovals = allApprovals.filter((approval) => {
      return (
        (!typeFilter || approval.type === typeFilter) &&
        (!coordFilter || approval.coordination === coordFilter) &&
        (!priorityFilter || approval.priority === priorityFilter) &&
        (!statusFilter || statusFilter === "all" || approval.status === statusFilter)
      );
    });

    renderApprovals();
    selectedApprovals.clear();
    document.getElementById("select-all").checked = false;
  }

  // Funções globais
  window.toggleSelectAll = () => {
    const selectAll = document.getElementById("select-all");
    const checkboxes = document.querySelectorAll(".approval-checkbox");

    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
      if (selectAll.checked) {
        selectedApprovals.add(checkbox.dataset.id);
      } else {
        selectedApprovals.delete(checkbox.dataset.id);
      }
    });
  };

  window.toggleApprovalSelection = (id) => {
    if (selectedApprovals.has(id)) {
      selectedApprovals.delete(id);
    } else {
      selectedApprovals.add(id);
    }

    // Atualizar checkbox "selecionar todos"
    const totalCheckboxes = document.querySelectorAll(".approval-checkbox").length;
    const selectAllCheckbox = document.getElementById("select-all");
    selectAllCheckbox.checked = selectedApprovals.size === totalCheckboxes;
  };

  window.viewApprovalDetails = (id) => {
    const approval = allApprovals.find((a) => a.id === id);
    if (!approval) return;

    currentApproval = approval;

    document.getElementById("modal-title").textContent = `Detalhes: ${approval.title}`;

    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4>Informações Gerais</h4>
                    <p><strong>Tipo:</strong> ${approval.type}</p>
                    <p><strong>Prioridade:</strong> ${approval.priority}</p>
                    <p><strong>Status:</strong> ${approval.status}</p>
                    <p><strong>Solicitante:</strong> ${approval.requester}</p>
                    <p><strong>Coordenação:</strong> ${approval.coordination}</p>
                    <p><strong>Data:</strong> ${approval.createdAt.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                    <h4>Detalhes Específicos</h4>
                    ${Object.entries(approval.details)
                      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                      .join("")}
                </div>
            </div>
            <div>
                <h4>Descrição</h4>
                <p>${approval.description}</p>
            </div>
        `;

    document.getElementById("details-modal").classList.remove("hidden");
  };

  window.closeDetailsModal = () => {
    document.getElementById("details-modal").classList.add("hidden");
    currentApproval = null;
  };

  window.quickApprove = (id) => {
    Swal.fire({
      title: "Aprovar Solicitação",
      text: "Deseja aprovar esta solicitação?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, aprovar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
        confirmButton: "my-swal-confirm-button",
        cancelButton: "my-swal-cancel-button",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        processApproval(id, "approved");
      }
    });
  };

  window.quickReject = (id) => {
    Swal.fire({
      title: "Rejeitar Solicitação",
      input: "textarea",
      inputLabel: "Motivo da rejeição:",
      inputPlaceholder: "Digite o motivo...",
      inputClass: "detail-input",
      showCancelButton: true,
      confirmButtonText: "Rejeitar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
        confirmButton: "my-swal-button",
        cancelButton: "my-swal-cancel-button",
        input: "detail-input",
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        processApproval(id, "rejected", result.value);
      }
    });
  };

  window.approveRequest = () => {
    if (!currentApproval) return;

    Swal.fire({
      title: "Aprovar Solicitação",
      text: "Deseja aprovar esta solicitação?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, aprovar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
        confirmButton: "my-swal-confirm-button",
        cancelButton: "my-swal-cancel-button",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        processApproval(currentApproval.id, "approved");
        window.closeDetailsModal();
      }
    });
  };

  window.rejectRequest = () => {
    if (!currentApproval) return;

    Swal.fire({
      title: "Rejeitar Solicitação",
      input: "textarea",
      inputLabel: "Motivo da rejeição:",
      inputPlaceholder: "Digite o motivo...",
      inputClass: "detail-input",
      showCancelButton: true,
      confirmButtonText: "Rejeitar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
        confirmButton: "my-swal-button",
        cancelButton: "my-swal-cancel-button",
        input: "detail-input",
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        processApproval(currentApproval.id, "rejected", result.value);
        window.closeDetailsModal();
      }
    });
  };

  window.bulkApprove = () => {
    if (selectedApprovals.size === 0) {
      Swal.fire({
        title: "Aviso",
        text: "Selecione pelo menos uma solicitação.",
        icon: "warning",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          text: "my-swal-text",
          confirmButton: "my-swal-confirm-button",
        },
      });
      return;
    }

    Swal.fire({
      title: "Aprovação em Massa",
      text: `Deseja aprovar ${selectedApprovals.size} solicitação(ões)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, aprovar todas",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
        confirmButton: "my-swal-confirm-button",
        cancelButton: "my-swal-cancel-button",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        selectedApprovals.forEach((id) => {
          processApproval(id, "approved");
        });
        selectedApprovals.clear();
        document.getElementById("select-all").checked = false;
      }
    });
  };

  window.refreshApprovals = () => {
    Swal.fire({
      title: "Atualizando",
      text: "Carregando solicitações mais recentes...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        text: "my-swal-text",
      },
    });

    setTimeout(() => {
      loadApprovals();
      loadStats();
      loadHistory();
      Swal.close();
    }, 1500);
  };

  async function processApproval(id, status, reason = null) {
    try {
      // Encontrar a aprovação
      const approvalIndex = allApprovals.findIndex((a) => a.id === id);
      if (approvalIndex === -1) return;

      // Atualizar status
      allApprovals[approvalIndex].status = status;
      allApprovals[approvalIndex].processedAt = new Date();
      allApprovals[approvalIndex].processedBy = currentUser.uid;
      if (reason) allApprovals[approvalIndex].reason = reason;

      // Em um sistema real, salvaria no Firestore
      // await db.collection('approvals').doc(id).update({
      //     status: status,
      //     processedAt: firebase.firestore.FieldValue.serverTimestamp(),
      //     processedBy: currentUser.uid,
      //     reason: reason
      // });

      // Log da atividade
      await db
        .collection("system")
        .doc("activity_logs")
        .collection("logs")
        .add({
          action: `approval_${status}`,
          user: currentUser.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          details: `Solicitação ${status === "approved" ? "aprovada" : "rejeitada"}: ${allApprovals[approvalIndex].title}`,
          approvalId: id,
        });

      Swal.fire({
        title: "Sucesso!",
        text: `Solicitação ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`,
        icon: "success",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          text: "my-swal-text",
          confirmButton: "my-swal-confirm-button",
        },
      });

      // Atualizar interface
      applyFilters();
      loadStats();
      loadHistory();
    } catch (error) {
      console.error("Erro ao processar aprovação:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível processar a solicitação.",
        icon: "error",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          text: "my-swal-text",
          confirmButton: "my-swal-confirm-button",
        },
      });
    }
  }
});