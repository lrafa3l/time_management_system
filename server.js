const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Configuração do diretório estático
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// 1. Rotas personalizadas (mapeamento explícito)
const rotasPersonalizadas = {
  '/pagina-inicial': 'main.html',
  '/calendario': 'calendar.html',
  '/turmas': 'classes.html',
  '/ajuda': 'help.html',
  '/docentes': 'prof.html',
  '/definicoes': 'setting.html',
  '/horario': 'view.html',
  '/horarios-feitos': 'schedule.html',
  '/conta': 'perfil.html',
  '/estatisticas': 'statistics.html'
};

// Registrar rotas personalizadas
Object.entries(rotasPersonalizadas).forEach(([rota, arquivo]) => {
  app.get(rota, (req, res) => {
    const filePath = path.join(__dirname, 'frontend', 'public', arquivo);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Página não encontrada');
    }
  });
});

// 2. Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

// 3. Rotas genéricas (para outros arquivos .html)
app.get('/:pagina', (req, res) => {
  const pagina = req.params.pagina;
  const filePath = path.join(__dirname, 'frontend', 'public', `${pagina}.html`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Página não encontrada');
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Rotas personalizadas disponíveis:');
  console.log(Object.keys(rotasPersonalizadas).join('\n'));
});