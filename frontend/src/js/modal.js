document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('formModal');
    const modalBody = document.querySelector('.modal-body');
    const modalTitle = document.getElementById('modalTitle');
    
    // Close modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Open modal with correct form
    document.querySelectorAll('.modal-trigger').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const formType = this.getAttribute('data-form');
            loadForm(formType);
            openModal();
        });
    });
    
    function openModal() {
        document.body.classList.add('modal-open');
        modal.style.display = 'flex';
        // Focus first input field when modal opens
        modal.querySelector('input')?.focus();
    }
    
    function closeModal() {
        document.body.classList.remove('modal-open');
        modal.style.display = 'none';
    }
    
    function loadForm(formType) {
        // Update title
        modalTitle.textContent = `Cadastro de ${formType.charAt(0).toUpperCase() + formType.slice(1)}`;
        
        // Create form HTML based on type
        let formHTML = '';
        let messageHTML = '<p id="mensagem"></p>';
        
        switch(formType) {
            case 'curso':
                formHTML = `
                    <form id="cadastro-curso">
                        <div class="form-group">
                            <label for="nome">Curso</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
                break;
                
            case 'sala':
                formHTML = `
                    <form id="cadastro-sala">
                        <div class="form-group">
                            <label for="nome">Sala</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="capacidade">Capacidade</label>
                            <input type="number" id="capacidade" name="capacidade" required>
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
                break;
                
            case 'turma':
                formHTML = `
                    <form id="cadastro-turma">
                        <div class="form-group">
                            <label for="nome">Turma</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="curso">Curso</label>
                            <select id="curso" name="curso" required>
                                <!-- Options would be loaded dynamically -->
                                <option value="">Selecione um curso</option>
                            </select>
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
                break;
                
            case 'professor':
                formHTML = `
                    <form id="cadastro-professor">
                        <div class="form-group">
                            <label for="nome">Nome Completo</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label for="email">E-mail</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
                break;
                
            case 'disciplina':
                formHTML = `
                    <form id="cadastro-disciplina">
                        <div class="form-group">
                            <label for="nome">Disciplina</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <button type="submit">Cadastrar</button>
                    </form>
                `;
                break;
        }
        
        // Inject form and message into modal
        modalBody.innerHTML = formHTML + messageHTML;
        
        // Add form submission handler
        const formId = `cadastro-${formType}`;
        document.getElementById(formId)?.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(formType, this);
        });
    }
    
    function handleFormSubmit(formType, form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const message = document.getElementById('mensagem');
        
        // Here you would typically make an API call
        console.log(`Submitting ${formType} form:`, data);
        
        // Simulate successful submission
        message.textContent = `${formType.charAt(0).toUpperCase() + formType.slice(1)} cadastrado com sucesso!`;
        message.className = '';
        
        // Clear form and close modal after 2 seconds
        setTimeout(() => {
            message.textContent = '';
            form.reset();
            closeModal();
        }, 2000);
    }
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
});
