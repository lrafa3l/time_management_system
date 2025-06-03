// Professor Schedule Management
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

class ProfessorSchedule {
  constructor() {
    this.currentUser = null
    this.schedule = []
    this.init()
  }

  async init() {
    await this.checkAuth()
    this.setupEventListeners()
    await this.loadSchedule()
    this.updateStats()
  }

  async checkAuth() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user
          const userDoc = await firebase.firestore().collection("users").doc(user.uid).get()

          if (userDoc.exists) {
            const userData = userDoc.data()
            document.getElementById("userInfo").textContent = userData.nome || user.email

            // Verificar se é professor
            if (userData.perfil !== "professor") {
              window.location.href = "index.html"
              return
            }
          }
          resolve()
        } else {
          window.location.href = "index.html"
        }
      })
    })
  }

  setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById("sidebarToggle")
    const sidebar = document.getElementById("sidebar")

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("-translate-x-full")
      })
    }
  }

  async loadSchedule() {
    try {
      const horarios = await firebase
        .firestore()
        .collection("horarios")
        .where("professorId", "==", this.currentUser.uid)
        .get()

      this.schedule = []
      horarios.forEach((doc) => {
        this.schedule.push({ id: doc.id, ...doc.data() })
      })

      this.renderSchedule()
    } catch (error) {
      console.error("Erro ao carregar horário:", error)
      this.showNotification("Erro ao carregar horário", "error")
    }
  }

  renderSchedule() {
    const scheduleTable = document.getElementById("scheduleTable")
    const timeSlots = [
      "07:00 - 07:45",
      "07:45 - 08:30",
      "08:30 - 09:15",
      "09:15 - 10:00",
      "10:15 - 11:00",
      "11:00 - 11:45",
      "11:45 - 12:30",
      "13:30 - 14:15",
      "14:15 - 15:00",
      "15:00 - 15:45",
      "15:45 - 16:30",
      "16:45 - 17:30",
      "17:30 - 18:15",
      "18:15 - 19:00",
      "19:00 - 19:45",
    ]

    const days = ["segunda", "terca", "quarta", "quinta", "sexta"]

    scheduleTable.innerHTML = ""

    timeSlots.forEach((timeSlot) => {
      const row = document.createElement("tr")
      row.className = "hover:bg-gray-50"

      // Time column
      const timeCell = document.createElement("td")
      timeCell.className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
      timeCell.textContent = timeSlot
      row.appendChild(timeCell)

      // Day columns
      days.forEach((day) => {
        const cell = document.createElement("td")
        cell.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-500"

        const classForSlot = this.schedule.find((item) => item.dia === day && item.horario === timeSlot)

        if (classForSlot) {
          cell.innerHTML = `
                        <div class="bg-blue-100 p-2 rounded border-l-4 border-blue-500">
                            <div class="font-medium text-blue-900">${classForSlot.disciplina}</div>
                            <div class="text-xs text-blue-700">${classForSlot.turma}</div>
                            <div class="text-xs text-blue-600">${classForSlot.sala}</div>
                        </div>
                    `
        } else {
          cell.innerHTML = '<span class="text-gray-300">-</span>'
        }

        row.appendChild(cell)
      })
      scheduleTable.appendChild(row)
    })
  }

  updateStats() {
    // Calculate weekly hours
    const weeklyHours = this.schedule.length * 0.75 // 45 minutes per class
    document.getElementById("weeklyHours").textContent = weeklyHours.toFixed(1)

    // Count unique classes
    const uniqueClasses = new Set(this.schedule.map((item) => item.turma))
    document.getElementById("totalClasses").textContent = uniqueClasses.size

    // Count unique subjects
    const uniqueSubjects = new Set(this.schedule.map((item) => item.disciplina))
    document.getElementById("totalSubjects").textContent = uniqueSubjects.size
  }

  showNotification(message, type = "info") {
    // Simple notification system
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ProfessorSchedule()
})


