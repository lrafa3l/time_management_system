document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const dashboardContainer = document.querySelector('.dashboard-container');
    const geminiApiKey = 'AIzaSyAxP9hKs7ZtMCcrpAVqud7XZW7I_oE9GTo'; // Substitua pela sua chave (em produção, use backend Node.js)

    // HTML do Chat de Ajuda
    dashboardContainer.innerHTML = `
        <div class="help-chat">
            <h2>Como podemos ajudar?</h2>
            <div id="chat-messages" style="height: 300px; overflow-y: scroll; margin-bottom: 10px; border: 1px solid #ddd; padding: 10px;"></div>
            <input type="text" id="user-question" placeholder="Digite sua dúvida..." style="width: 100%; padding: 8px; margin-bottom: 10px;">
            <button id="ask-button" style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px;">Enviar</button>
        </div>
    `;

    // Inicializa a Gemini API
    const genAI = new googleGenerativeAI.GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Função para adicionar mensagens ao chat
    function addMessage(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Evento do botão "Enviar"
    document.getElementById('ask-button').addEventListener('click', async () => {
        const userInput = document.getElementById('user-question');
        const question = userInput.value.trim();

        if (!question) return;

        addMessage("Você", question);
        userInput.value = '';

        try {
            const result = await model.generateContent(question);
            const response = await result.response;
            const text = response.text();
            addMessage("Assistente", text);
        } catch (error) {
            console.error("Erro na Gemini API:", error);
            addMessage("Assistente", "Desculpe, ocorreu um erro. Tente novamente.");
        }
    });
});