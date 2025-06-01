// Script simplificado para inicializar dados do sistema
const simpleInitializer = {
  // Configuração Firebase
  firebaseConfig: {
    apiKey: "AIzaSyA-3WwKHF1-f4fi5sHapRAsNr9INX0Etgo",
    authDomain: "schedule-system-8c4b6.firebaseapp.com",
    databaseURL: "https://schedule-system-8c4b6-default-rtdb.firebaseio.com",
    projectId: "schedule-system-8c4b6",
    storageBucket: "schedule-system-8c4b6.firebasestorage.app",
    messagingSenderId: "1056197912318",
    appId: "1:1056197912318:web:2868c9a27bcc03587e27af",
    measurementId: "G-GHEY7QZEQ9",
  },

  // Dados básicos
  disciplinas: [
    "Electricidade",
    "Tecnologias Eléctricas",
    "Práticas Oficinais e Laboratoriais",
    "Máquinas Eléctricas",
    "Instalações Eléctricas",
    "Matemática",
    "Física",
    "Formação de Atitudes Integradoras",
    "Projecto Tecnológico",
    "Língua Portuguesa",
    "Educação Física",
    "Empreendedorismo",
    "Oficina de Produção e Mobiliário",
    "Design de Projecto Mobiliário",
    "Organização e Orçamentos",
    "Materias e Tecnologias",
    "Metrologia",
    "Sistemas de Refrigeração",
    "Climatização",
    "Termotécnica",
    "Máquinas Frigoríficas",
    "Instalações de Frio",
    "Técnicas de Línguagens Programação",
    "Sistema Exploração e Arquitectura do Computador",
    "Redes",
    "Organização e Gestão de Empresas",
    "Tecnologias de Informação e Comunicação",
    "Desenho Técnico",
    "Materiais de Construção",
    "Estruturas",
    "Topografia",
    "Orçamentos e Medições",
    "CAD",
    "Geometria Descritiva",
    "Projecto de Arquitectura",
    "Materiais",
    "Electrónica",
  ],

  coordenacoes: [
    { id: "EIE", nome: "Energia e Instalações Eléctricas", coordenador: "Ezequiel Mazezela" },
    { id: "TM", nome: "Tecnologia de Móveis", coordenador: "Silsom Bravo" },
    { id: "FC", nome: "Frio e Climatização", coordenador: "Gilberto Oleque" },
    { id: "GSI", nome: "Gestão de Sistemas Informáticos", coordenador: "Paulo Dala" },
    { id: "OCC", nome: "Obras de Construção Civil", coordenador: "Lucas Fragoso" },
    { id: "DP", nome: "Desenhador Projectista", coordenador: "Muto Kalembe" },
    { id: "INF", nome: "Informática", coordenador: "Diassilua Paulo" },
  ],

  // Aguardar Firebase
  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50

      const checkFirebase = () => {
        attempts++
        if (typeof window !== "undefined" && window.firebase && window.firebase.apps !== undefined) {
          resolve(window.firebase)
        } else if (attempts >= maxAttempts) {
          reject(new Error("Firebase não carregou"))
        } else {
          setTimeout(checkFirebase, 100)
        }
      }
      checkFirebase()
    })
  },

  // Inicializar Firebase
  async initFirebase() {
    const firebase = await this.waitForFirebase()

    if (!firebase.apps.length) {
      firebase.initializeApp(this.firebaseConfig)
    }

    this.db = firebase.firestore()
    this.auth = firebase.auth()

    console.log("Firebase inicializado")
    return firebase
  },

  // Criar dados básicos sem autenticação
  async createBasicData() {
    console.log("Criando dados básicos...")

    // 1. Criar disciplinas
    console.log("Criando disciplinas...")
    for (const disciplina of this.disciplinas) {
      try {
        await this.db.collection("disciplinas").add({
          nome: disciplina,
          nomeNormalized: disciplina.toLowerCase(),
          ativo: true,
          criadoEm: new Date(),
        })
      } catch (error) {
        console.log(`Erro ao criar disciplina ${disciplina}:`, error.message)
      }
    }

    // 2. Criar coordenações
    console.log("Criando coordenações...")
    for (const coord of this.coordenacoes) {
      try {
        await this.db.collection("coordenacoes").doc(coord.id).set({
          id: coord.id,
          nome: coord.nome,
          coordenador: coord.coordenador,
          ativo: true,
          criadoEm: new Date(),
        })
      } catch (error) {
        console.log(`Erro ao criar coordenação ${coord.nome}:`, error.message)
      }
    }

    // 3. Criar salas
    console.log("Criando salas...")
    for (let i = 1; i <= 23; i++) {
      try {
        await this.db
          .collection("salas")
          .doc(`sala_${i}`)
          .set({
            id: `sala_${i}`,
            nome: `Sala ${i}`,
            tipo: "normal",
            capacidade: 35,
            recursos: ["quadro", "projetor"],
            ativo: true,
            criadoEm: new Date(),
          })
      } catch (error) {
        console.log(`Erro ao criar sala ${i}:`, error.message)
      }
    }

    // 4. Criar laboratórios
    const labs = [
      { id: "lab_inf_1", nome: "Lab. Informática 1", recursos: ["computadores", "projetor"] },
      { id: "lab_inf_2", nome: "Lab. Informática 2", recursos: ["computadores", "projetor"] },
      { id: "lab_inf_3", nome: "Lab. Informática 3", recursos: ["computadores", "projetor"] },
      { id: "lab_civil", nome: "Lab. Construção Civil", recursos: ["materiais_construcao"] },
      { id: "lab_eletricidade", nome: "Lab. Electricidade", recursos: ["equipamentos_eletricos"] },
    ]

    for (const lab of labs) {
      try {
        await this.db.collection("salas").doc(lab.id).set({
          id: lab.id,
          nome: lab.nome,
          tipo: "laboratorio",
          capacidade: 25,
          recursos: lab.recursos,
          ativo: true,
          criadoEm: new Date(),
        })
      } catch (error) {
        console.log(`Erro ao criar ${lab.nome}:`, error.message)
      }
    }

    // 5. Criar turmas
    console.log("Criando turmas...")
    const classes = ["10", "11", "12"]
    const letras = ["A", "B"]

    for (const coord of this.coordenacoes) {
      for (const classe of classes) {
        for (const letra of letras) {
          const turno = classe === "10" ? "M" : "T"
          const turmaId = `${coord.id}${classe}${letra}${turno}`

          try {
            await this.db
              .collection("turmas")
              .doc(turmaId)
              .set({
                id: turmaId,
                nome: turmaId,
                coordenacao: coord.id,
                classe: classe,
                turma: letra,
                turno: turno === "M" ? "Manhã" : "Tarde",
                capacidade: 35,
                ativo: true,
                criadoEm: new Date(),
              })
          } catch (error) {
            console.log(`Erro ao criar turma ${turmaId}:`, error.message)
          }
        }
      }
    }

    // 6. Criar configurações do sistema
    console.log("Criando configurações...")
    try {
      await this.db
        .collection("configuracoes")
        .doc("sistema")
        .set({
          nomeEscola: 'Instituto Politécnico Industrial do Kilamba Kiaxi Nº 8056 "Nova Vida"',
          slogan: "Um diferencial para a sua formação",
          anoLetivo: "2024/2025",
          diretor: "Ferreira Manuel Fragoso Ph, D",
          subdirectorPedagogico: "Eng.º Carlos Alberto Brito Teixeira da Silva",
          emailNotificacoes: "notificacoes@ipikk.edu.ao",
          horariosConfig: {
            tempoAula: 50,
            intervalos: {
              manha: "9H40-10H00",
              almoco: "12H40-13H00",
            },
            horarios: {
              manha: ["7H00-7H50", "7H55-8H45", "8H50-9H40", "10H00-10H50", "10H55-11H45", "11H50-12H40"],
              tarde: ["13H00-13H50", "13H55-14H45", "14H50-15H40", "16H00-16H50", "16H55-17H45"],
            },
          },
          criadoEm: new Date(),
        })
    } catch (error) {
      console.log("Erro ao criar configurações:", error.message)
    }

    console.log("✅ Dados básicos criados com sucesso!")
  },

  // Executar inicialização
  async initialize() {
    try {
      console.log("🚀 Iniciando configuração básica do sistema...")

      await this.initFirebase()
      await this.createBasicData()

      console.log("✅ Sistema inicializado com sucesso!")
      console.log("📝 Próximos passos:")
      console.log("1. Criar usuários manualmente no Firebase Authentication")
      console.log("2. Atualizar regras do Firestore para produção")
      console.log("3. Configurar perfis de professores")
    } catch (error) {
      console.error("❌ Erro na inicialização:", error)
    }
  },
}

// Disponibilizar globalmente
if (typeof window !== "undefined") {
  window.simpleInitializer = simpleInitializer
}
