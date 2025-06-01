// Script para inicializar dados do sistema
const dataInitializer = {
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

  // Coordenações e suas disciplinas
  coordenacoes: [
    {
      id: "EIE",
      nome: "Energia e Instalações Eléctricas",
      coordenador: "Ezequiel Mazezela",
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
      ],
    },
    {
      id: "TM",
      nome: "Tecnologia de Móveis",
      coordenador: "Silsom Bravo",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Oficina de Produção e Mobiliário",
        "Design de Projecto Mobiliário",
        "Organização e Orçamentos",
        "Materias e Tecnologias",
        "Metrologia",
      ],
    },
    {
      id: "FC",
      nome: "Frio e Climatização",
      coordenador: "Gilberto Oleque",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Sistemas de Refrigeração",
        "Climatização",
        "Termotécnica",
        "Máquinas Frigoríficas",
        "Instalações de Frio",
      ],
    },
    {
      id: "GSI",
      nome: "Gestão de Sistemas Informáticos",
      coordenador: "Paulo Dala",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Técnicas de Línguagens Programação",
        "Sistema Exploração e Arquitectura do Computador",
        "Redes",
        "Organização e Gestão de Empresas",
        "Empreendedorismo",
        "Tecnologias de Informação e Comunicação",
        "Desenho Técnico",
        "Educação Física",
      ],
    },
    {
      id: "OCC",
      nome: "Obras de Construção Civil",
      coordenador: "Lucas Fragoso",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Desenho Técnico",
        "Materiais de Construção",
        "Estruturas",
        "Topografia",
        "Orçamentos e Medições",
      ],
    },
    {
      id: "DP",
      nome: "Desenhador Projectista",
      coordenador: "Muto Kalembe",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Desenho Técnico",
        "CAD",
        "Geometria Descritiva",
        "Projecto de Arquitectura",
        "Materiais",
      ],
    },
    {
      id: "INF",
      nome: "Informática",
      coordenador: "Diassilua Paulo",
      disciplinas: [
        "Matemática",
        "Física",
        "Formação de Atitudes Integradoras",
        "Projecto Tecnológico",
        "Língua Portuguesa",
        "Técnicas de Línguagens Programação",
        "Sistema Exploração e Arquitectura do Computador",
        "Redes",
        "Organização e Gestão de Empresas",
        "Empreendedorismo",
        "Tecnologias de Informação e Comunicação",
        "Desenho Técnico",
        "Educação Física",
        "Electrónica",
      ],
    },
  ],

  // Salas da escola
  salas: [
    // Salas normais
    ...Array.from({ length: 23 }, (_, i) => ({
      id: `sala_${i + 1}`,
      nome: `Sala ${i + 1}`,
      tipo: "normal",
      capacidade: 35,
      recursos: ["quadro", "projetor"],
    })),
    // Laboratórios
    {
      id: "lab_inf_1",
      nome: "Lab. Informática 1",
      tipo: "laboratorio",
      capacidade: 25,
      recursos: ["computadores", "projetor", "internet"],
    },
    {
      id: "lab_inf_2",
      nome: "Lab. Informática 2",
      tipo: "laboratorio",
      capacidade: 25,
      recursos: ["computadores", "projetor", "internet"],
    },
    {
      id: "lab_inf_3",
      nome: "Lab. Informática 3",
      tipo: "laboratorio",
      capacidade: 25,
      recursos: ["computadores", "projetor", "internet"],
    },
    {
      id: "lab_civil",
      nome: "Lab. Construção Civil",
      tipo: "laboratorio",
      capacidade: 20,
      recursos: ["materiais_construcao", "ferramentas"],
    },
    {
      id: "lab_eletricidade",
      nome: "Lab. Electricidade",
      tipo: "laboratorio",
      capacidade: 20,
      recursos: ["equipamentos_eletricos", "bancadas"],
    },
    {
      id: "oficina_mecanica",
      nome: "Oficina Mecânica",
      tipo: "oficina",
      capacidade: 15,
      recursos: ["maquinas", "ferramentas"],
    },
    {
      id: "lab_quimica_fisica",
      nome: "Lab. Química e Física",
      tipo: "laboratorio",
      capacidade: 20,
      recursos: ["bancadas", "equipamentos_laboratorio"],
    },
  ],

  // Gerar turmas
  generateTurmas() {
    const turmas = []
    const classes = ["10", "11", "12"]
    const turmasLetras = ["A", "B"]

    this.coordenacoes.forEach((coord) => {
      classes.forEach((classe) => {
        turmasLetras.forEach((letra) => {
          // 10ª classe sempre manhã, 11ª e 12ª tarde
          const turno = classe === "10" ? "M" : "T"

          turmas.push({
            id: `${coord.id}${classe}${letra}${turno}`,
            nome: `${coord.id}${classe}${letra}${turno}`,
            coordenacao: coord.id,
            classe: classe,
            turma: letra,
            turno: turno === "M" ? "Manhã" : "Tarde",
            capacidade: 35,
            ativo: true,
          })
        })
      })
    })

    return turmas
  },

  // Professores iniciais
  professoresIniciais: [
    {
      nome: "Administrador do Sistema",
      email: "admin@ipikk.edu.ao",
      cargo: "Administrador",
      role: "admin",
    },
    {
      nome: "Ezequiel Mazezela",
      email: "ezequiel.mazezela@ipikk.edu.ao",
      coordenacao: "EIE",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Electricidade", "Tecnologias Eléctricas"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Silsom Bravo",
      email: "silsom.bravo@ipikk.edu.ao",
      coordenacao: "TM",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Design de Projecto Mobiliário", "Oficina de Produção e Mobiliário"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Gilberto Oleque",
      email: "gilberto.oleque@ipikk.edu.ao",
      coordenacao: "FC",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Sistemas de Refrigeração", "Climatização"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Paulo Dala",
      email: "paulo.dala@ipikk.edu.ao",
      coordenacao: "GSI",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Técnicas de Línguagens Programação", "Redes"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Lucas Fragoso",
      email: "lucas.fragoso@ipikk.edu.ao",
      coordenacao: "OCC",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Desenho Técnico", "Materiais de Construção"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Muto Kalembe",
      email: "muto.kalembe@ipikk.edu.ao",
      coordenacao: "DP",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["CAD", "Projecto de Arquitectura"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    {
      nome: "Diassilua Paulo",
      email: "diassilua.paulo@ipikk.edu.ao",
      coordenacao: "INF",
      cargo: "Coordenador",
      categoria: "Prof. Do Ens. Prim. E Sec. Do 7.º Grau",
      disciplinas: ["Técnicas de Línguagens Programação", "Sistema Exploração e Arquitectura do Computador"],
      classes: ["10", "11", "12"],
      role: "coordenador",
    },
    // Direção
    {
      nome: "Ferreira Manuel Fragoso",
      email: "director@ipikk.edu.ao",
      cargo: "Director",
      categoria: "Ph.D",
      role: "director",
    },
    {
      nome: "Carlos Alberto Brito Teixeira da Silva",
      email: "subdirector@ipikk.edu.ao",
      cargo: "Subdirector Pedagógico",
      categoria: "Eng.º",
      role: "subdirector",
    },
  ],

  // Verificar se Firebase está disponível
  waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50

      const checkFirebase = () => {
        attempts++

        if (typeof window !== "undefined" && window.firebase !== "undefined" && window.firebase.apps !== "undefined") {
          resolve(window.firebase)
        } else if (attempts >= maxAttempts) {
          reject(new Error("Firebase não foi carregado após 5 segundos"))
        } else {
          setTimeout(checkFirebase, 100)
        }
      }

      checkFirebase()
    })
  },

  // Inicializar Firebase
  async initFirebase() {
    try {
      console.log("Aguardando Firebase carregar...")
      const firebaseInstance = await this.waitForFirebase()

      console.log("Firebase detectado, inicializando...")

      if (!firebaseInstance.apps.length) {
        firebaseInstance.initializeApp(this.firebaseConfig)
        console.log("Firebase app inicializado")
      } else {
        console.log("Firebase app já estava inicializado")
      }

      this.db = firebaseInstance.firestore()
      this.auth = firebaseInstance.auth()

      console.log("Firebase inicializado com sucesso")
      return firebaseInstance
    } catch (error) {
      console.error("Erro ao inicializar Firebase:", error)
      throw error
    }
  },

  // Criar usuário admin primeiro
  async createAdminUser() {
    console.log("Criando usuário administrador...")

    try {
      // Criar usuário admin no Firebase Auth
      const userCredential = await this.auth.createUserWithEmailAndPassword("admin@ipikk.edu.ao", "admin123")

      const user = userCredential.user
      await user.updateProfile({ displayName: "Administrador do Sistema" })

      // Criar documento do usuário admin
      await this.db.collection("users").doc(user.uid).set({
        role: "admin",
        coordenacao: "",
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })

      // Criar documento do professor admin
      await this.db.collection("professores").doc(user.uid).set({
        nome: "Administrador do Sistema",
        nomeNormalized: "administrador do sistema",
        email: "admin@ipikk.edu.ao",
        emailNormalized: "admin@ipikk.edu.ao",
        contacto: "",
        formacaoMedio: "",
        habilitacoes: "",
        unidade: 'Instituto Politécnico Industrial do Kilamba Kiaxi Nº 8056 "Nova Vida"',
        categoria: "Administrador",
        classes: [],
        disciplinas: [],
        coordenacao: "",
        cargo: "Administrador",
        userId: user.uid,
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })

      console.log("Usuário administrador criado com sucesso")
      return user
    } catch (error) {
      console.error("Erro ao criar usuário admin:", error)
      throw error
    }
  },

  // Fazer login como admin
  async loginAsAdmin() {
    console.log("Fazendo login como administrador...")

    try {
      await this.auth.signInWithEmailAndPassword("admin@ipikk.edu.ao", "admin123")
      console.log("Login como admin realizado com sucesso")
    } catch (error) {
      console.error("Erro ao fazer login como admin:", error)
      throw error
    }
  },

  // Criar disciplinas
  async createDisciplinas() {
    console.log("Criando disciplinas...")
    const batch = this.db.batch()
    const disciplinasSet = new Set()

    // Coletar todas as disciplinas únicas
    this.coordenacoes.forEach((coord) => {
      coord.disciplinas.forEach((disc) => disciplinasSet.add(disc))
    })

    // Criar documentos de disciplinas
    Array.from(disciplinasSet).forEach((disciplina) => {
      const docRef = this.db.collection("disciplinas").doc()
      batch.set(docRef, {
        id: docRef.id,
        nome: disciplina,
        nomeNormalized: disciplina.toLowerCase(),
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
    console.log(`${disciplinasSet.size} disciplinas criadas`)
  },

  // Criar coordenações
  async createCoordenacoes() {
    console.log("Criando coordenações...")
    const batch = this.db.batch()

    for (const coord of this.coordenacoes) {
      const docRef = this.db.collection("coordenacoes").doc(coord.id)

      // Buscar IDs das disciplinas
      const disciplinasIds = []
      for (const disciplinaNome of coord.disciplinas) {
        const disciplinaQuery = await this.db
          .collection("disciplinas")
          .where("nome", "==", disciplinaNome)
          .limit(1)
          .get()

        if (!disciplinaQuery.empty) {
          disciplinasIds.push(disciplinaQuery.docs[0].id)
        }
      }

      batch.set(docRef, {
        id: coord.id,
        nome: coord.nome,
        coordenador: coord.coordenador,
        disciplinas: disciplinasIds,
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
    console.log(`${this.coordenacoes.length} coordenações criadas`)
  },

  // Criar salas
  async createSalas() {
    console.log("Criando salas...")
    const batch = this.db.batch()

    this.salas.forEach((sala) => {
      const docRef = this.db.collection("salas").doc(sala.id)
      batch.set(docRef, {
        ...sala,
        ativo: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
    console.log(`${this.salas.length} salas criadas`)
  },

  // Criar turmas
  async createTurmas() {
    console.log("Criando turmas...")
    const turmas = this.generateTurmas()
    const batch = this.db.batch()

    turmas.forEach((turma) => {
      const docRef = this.db.collection("turmas").doc(turma.id)
      batch.set(docRef, {
        ...turma,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
    console.log(`${turmas.length} turmas criadas`)
  },

  // Criar professores e usuários
  async createProfessoresAndUsers() {
    console.log("Criando professores e usuários...")

    // Pular o admin que já foi criado
    const professoresParaCriar = this.professoresIniciais.filter((prof) => prof.role !== "admin")

    for (const prof of professoresParaCriar) {
      try {
        // Criar usuário no Firebase Auth
        const userCredential = await this.auth.createUserWithEmailAndPassword(prof.email, "senha123")

        const user = userCredential.user
        await user.updateProfile({ displayName: prof.nome })

        // Buscar IDs das disciplinas se existirem
        const disciplinasIds = []
        if (prof.disciplinas) {
          for (const disciplinaNome of prof.disciplinas) {
            const disciplinaQuery = await this.db
              .collection("disciplinas")
              .where("nome", "==", disciplinaNome)
              .limit(1)
              .get()

            if (!disciplinaQuery.empty) {
              disciplinasIds.push(disciplinaQuery.docs[0].id)
            }
          }
        }

        // Criar documento do usuário
        await this.db
          .collection("users")
          .doc(user.uid)
          .set({
            role: prof.role,
            coordenacao: prof.coordenacao || "",
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          })

        // Criar documento do professor
        await this.db
          .collection("professores")
          .doc(user.uid)
          .set({
            nome: prof.nome,
            nomeNormalized: prof.nome.toLowerCase(),
            email: prof.email,
            emailNormalized: prof.email.toLowerCase(),
            contacto: "",
            formacaoMedio: "",
            habilitacoes: "",
            unidade: 'Instituto Politécnico Industrial do Kilamba Kiaxi Nº 8056 "Nova Vida"',
            categoria: prof.categoria || "",
            classes: prof.classes || [],
            disciplinas: disciplinasIds,
            coordenacao: prof.coordenacao || "",
            cargo: prof.cargo,
            userId: user.uid,
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          })

        console.log(`Professor criado: ${prof.nome}`)
      } catch (error) {
        console.error(`Erro ao criar professor ${prof.nome}:`, error)
      }
    }
  },

  // Criar configurações do sistema
  async createSystemSettings() {
    console.log("Criando configurações do sistema...")

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
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      })

    console.log("Configurações do sistema criadas")
  },

  // Executar inicialização completa
  async initializeAll() {
    try {
      console.log("Iniciando configuração do sistema...")

      await this.initFirebase()
      await this.createAdminUser()
      await this.loginAsAdmin()
      await this.createDisciplinas()
      await this.createCoordenacoes()
      await this.createSalas()
      await this.createTurmas()
      await this.createProfessoresAndUsers()
      await this.createSystemSettings()

      console.log("✅ Sistema inicializado com sucesso!")
      console.log("Dados criados:")
      console.log("- Disciplinas: " + Array.from(new Set(this.coordenacoes.flatMap((c) => c.disciplinas))).length)
      console.log("- Coordenações: " + this.coordenacoes.length)
      console.log("- Salas: " + this.salas.length)
      console.log("- Turmas: " + this.generateTurmas().length)
      console.log("- Professores: " + this.professoresIniciais.length)

      console.log("\n📧 Credenciais de acesso:")
      console.log("Admin: admin@ipikk.edu.ao / admin123")
      console.log("Outros usuários: senha123")
      console.log("IMPORTANTE: Altere as senhas no primeiro login!")
    } catch (error) {
      console.error("❌ Erro na inicialização:", error)
      throw error
    }
  },
}

// Para usar no navegador
if (typeof window !== "undefined") {
  window.dataInitializer = dataInitializer
}

// Para usar com Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = dataInitializer
}
