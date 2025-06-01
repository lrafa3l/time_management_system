const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configura CORS para permitir requisições externas (ex.: Firebase)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Configuração do diretório estático com log para depuração
app.use(express.static(path.join(__dirname, 'frontend', 'public'), {
    setHeaders: (res, path) => {
        console.log(`Servindo arquivo estático: ${path}`);
    }
}));

// Rotas personalizadas (mapeamento explícito)
const rotasPersonalizadas = {
    '/dashboard-admin': 'dashboard-admin.html',
    '/director': 'dashboard-director.html',
    '/director/relatorios': 'director-reports.html',
    '/director/aprovacoes': 'director-approvals.html',
    '/subdirector': 'dashboard-subdirector.html',
    '/operacoes': 'subdirector-operations.html',
    '/coordenador': 'dashboard-coordenador.html',
    '/professor': 'professor-schedule.html',
    '/calendario': 'calendar.html',
    '/turmas': 'classes.html',
    '/ajuda': 'help.html',
    '/docentes': 'prof.html',
    '/definicoes': 'setting.html',
    '/horario': 'view.html',
    '/horarios-feitos': 'schedule.html',
    '/admin': 'admin.html',
    '/permissoes': 'admin-permissions.html',
    '/backup': 'admin-backup.html',
    '/conta': 'perfil.html',
    '/notificacoes': 'notifications.html',
    '/estatisticas': 'statistics.html'
};

// Registrar rotas personalizadas
Object.entries(rotasPersonalizadas).forEach(([rota, arquivo]) => {
    app.get(rota, (req, res) => {
        const filePath = path.join(__dirname, 'frontend', 'public', arquivo);
        if (fs.existsSync(filePath)) {
            console.log(`Rota ${rota} servindo: ${filePath}`);
            res.sendFile(filePath);
        } else {
            console.log(`Arquivo não encontrado para rota ${rota}: ${filePath}`);
            res.status(404).send('Página não encontrada');
        }
    });
});

// Rota raiz (login)
app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'frontend', 'public', 'index.html');
    if (fs.existsSync(filePath)) {
        console.log(`Rota /login servindo: ${filePath}`);
        res.sendFile(filePath);
    } else {
        console.log(`Arquivo não encontrado para /login: ${filePath}`);
        res.status(404).send('Página de login não encontrada');
    }
});

// Rotas genéricas (para outros arquivos .html)
app.get('/:pagina', (req, res) => {
    const pagina = req.params.pagina;
    const filePath = path.join(__dirname, 'frontend', 'public', `${pagina}.html`);
    if (fs.existsSync(filePath)) {
        console.log(`Rota genérica /${pagina} servindo: ${filePath}`);
        res.sendFile(filePath);
    } else {
        console.log(`Arquivo não encontrado para /${pagina}: ${filePath}`);
        res.status(404).send('Página não encontrada');
    }
});

// Manipulação de erros genéricos
app.use((err, req, res, next) => {
    console.error(`Erro no servidor: ${err.stack}`);
    res.status(500).send('Erro interno no servidor');
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Rotas personalizadas disponíveis:');
    console.log(Object.keys(rotasPersonalizadas).join('\n'));
});