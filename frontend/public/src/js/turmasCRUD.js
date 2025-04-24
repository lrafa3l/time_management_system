// Armazenamento temporário (substituir por API real)
let turmas = [
    { id: 1, nome: "GSI10AM", sala: "12", ano: "2023" },
    { id: 2, nome: "GSI11BT", sala: "15", ano: "2023" },
    { id: 3, nome: "GSI12CT", sala: "08", ano: "2024" }
];

// Elementos do DOM
const turmasTable = document.querySelector('.turmas-table tbody');
const turmaModal = document.getElementById('turmaModal');
const turmaForm = document.getElementById('turmaForm');
const modalTitle = document.getElementById('modalTitle');
const createTurmaButton = document.getElementById('createTurmaButton');

// Carregar turmas na tabela
function loadTurmas() {
    turmasTable.innerHTML = '';
    turmas.forEach(turma => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${turma.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">${turma.sala}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">${turma.ano}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <button onclick="editTurma(${turma.id})" class="btn-edit">
                    <i class="fas fa-edit mr-1"></i> Editar
                </button>
                <button onclick="deleteTurma(${turma.id})" class="btn-danger">
                    <i class="fas fa-trash mr-1"></i> Excluir
                </button>
            </td>
        `;
        turmasTable.appendChild(row);
    });
}

// Abrir modal para criar nova turma
function openTurmaModal() {
    turmaForm.reset();
    document.getElementById('turmaId').value = '';
    modalTitle.textContent = 'Adicionar Turma';
    turmaModal.classList.remove('hidden');
}

// Abrir modal para editar turma
function editTurma(id) {
    const turma = turmas.find(t => t.id === id);
    if (turma) {
        document.getElementById('turmaId').value = turma.id;
        document.getElementById('turmaNome').value = turma.nome;
        document.getElementById('turmaSala').value = turma.sala;
        document.getElementById('turmaAno').value = turma.ano;
        modalTitle.textContent = 'Editar Turma';
        turmaModal.classList.remove('hidden');
    }
}

// Fechar modal
function closeTurmaModal() {
    turmaModal.classList.add('hidden');
}

// Salvar turma (criar ou atualizar)
turmaForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const turmaData = {
        id: document.getElementById('turmaId').value,
        nome: document.getElementById('turmaNome').value,
        sala: document.getElementById('turmaSala').value,
        ano: document.getElementById('turmaAno').value
    };
    
    if (turmaData.id) {
        // Atualizar turma existente
        const index = turmas.findIndex(t => t.id == turmaData.id);
        if (index !== -1) {
            turmas[index] = { ...turmas[index], ...turmaData };
        }
    } else {
        // Criar nova turma
        turmaData.id = turmas.length > 0 ? Math.max(...turmas.map(t => t.id)) + 1 : 1;
        turmas.push(turmaData);
    }
    
    loadTurmas();
    closeTurmaModal();
});

// Excluir turma
function deleteTurma(id) {
    if (confirm('Tem certeza que deseja excluir esta turma?')) {
        turmas = turmas.filter(turma => turma.id !== id);
        loadTurmas();
    }
}

// Event Listeners
createTurmaButton.addEventListener('click', openTurmaModal);

// Inicialização
document.addEventListener('DOMContentLoaded', loadTurmas);