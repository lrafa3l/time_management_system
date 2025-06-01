// Professor Calendar Management
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

class ProfessorCalendar {
  constructor() {
    this.currentUser = null
    this.currentDate = new Date()
    this.events = []
    this.init()
  }

  async init() {
    await this.checkAuth()
    this.setupEventListeners()
    this.renderCalendar()
    await this.loadEvents()
    this.updateUpcomingEvents()
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

    // Calendar navigation
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
      this.renderCalendar()
    })

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
      this.renderCalendar()
    })

    document.getElementById("todayBtn").addEventListener("click", () => {
      this.currentDate = new Date()
      this.renderCalendar()
    })

    // Event modal
    document.getElementById("addEventBtn").addEventListener("click", () => {
      this.showEventModal()
    })

    document.getElementById("cancelEvent").addEventListener("click", () => {
      this.hideEventModal()
    })

    document.getElementById("eventForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveEvent()
    })
  }

  renderCalendar() {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]

    document.getElementById("currentMonth").textContent =
      `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const calendarGrid = document.getElementById("calendarGrid")
    calendarGrid.innerHTML = ""

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + i)

      const cell = document.createElement("div")
      cell.className = "min-h-24 p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50"

      const isCurrentMonth = cellDate.getMonth() === this.currentDate.getMonth()
      const isToday = this.isToday(cellDate)

      cell.innerHTML = `
                <div class="flex justify-between items-start">
                    <span class="${isCurrentMonth ? "text-gray-900" : "text-gray-400"} ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm" : ""} font-medium">
                        ${cellDate.getDate()}
                    </span>
                </div>
                <div class="mt-1 space-y-1" id="events-${this.formatDate(cellDate)}">
                    <!-- Events for this day will be added here -->
                </div>
            `

      cell.addEventListener("click", () => {
        document.getElementById("eventDate").value = this.formatDate(cellDate)
        this.showEventModal()
      })

      calendarGrid.appendChild(cell)
    }

    this.renderEvents()
  }

  async loadEvents() {
    try {
      const events = await firebase.firestore().collection("events").where("userId", "==", this.currentUser.uid).get()

      this.events = []
      events.forEach((doc) => {
        this.events.push({ id: doc.id, ...doc.data() })
      })

      this.renderEvents()
      this.updateUpcomingEvents()
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    }
  }

  renderEvents() {
    // Clear existing events
    const eventContainers = document.querySelectorAll('[id^="events-"]')
    eventContainers.forEach((container) => {
      container.innerHTML = ""
    })

    // Add events to calendar
    this.events.forEach((event) => {
      const eventContainer = document.getElementById(`events-${event.date}`)
      if (eventContainer) {
        const eventElement = document.createElement("div")
        eventElement.className = "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
        eventElement.textContent = event.title
        eventElement.title = `${event.title} - ${event.time || "Todo o dia"}`
        eventContainer.appendChild(eventElement)
      }
    })
  }

  updateUpcomingEvents() {
    const upcomingEvents = document.getElementById("upcomingEvents")
    const today = new Date()
    const upcoming = this.events
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)

    if (upcoming.length === 0) {
      upcomingEvents.innerHTML = '<p class="text-gray-500">Nenhum evento próximo</p>'
      return
    }

    upcomingEvents.innerHTML = upcoming
      .map(
        (event) => `
            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-3">
                <div>
                    <h4 class="font-medium text-gray-900">${event.title}</h4>
                    <p class="text-sm text-gray-600">${this.formatDateDisplay(event.date)} ${event.time ? `às ${event.time}` : ""}</p>
                    ${event.description ? `<p class="text-sm text-gray-500 mt-1">${event.description}</p>` : ""}
                </div>
                <button onclick="professorCalendar.deleteEvent('${event.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `,
      )
      .join("")
  }

  showEventModal() {
    document.getElementById("eventModal").classList.remove("hidden")
  }

  hideEventModal() {
    document.getElementById("eventModal").classList.add("hidden")
    document.getElementById("eventForm").reset()
  }

  async saveEvent() {
    const title = document.getElementById("eventTitle").value
    const date = document.getElementById("eventDate").value
    const time = document.getElementById("eventTime").value
    const description = document.getElementById("eventDescription").value

    try {
      await firebase.firestore().collection("events").add({
        title,
        date,
        time,
        description,
        userId: this.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })

      this.hideEventModal()
      await this.loadEvents()
      this.showNotification("Evento criado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar evento:", error)
      this.showNotification("Erro ao criar evento", "error")
    }
  }

  async deleteEvent(eventId) {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        await firebase.firestore().collection("events").doc(eventId).delete()
        await this.loadEvents()
        this.showNotification("Evento excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir evento:", error)
        this.showNotification("Erro ao excluir evento", "error")
      }
    }
  }

  isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  formatDate(date) {
    return date.toISOString().split("T")[0]
  }

  formatDateDisplay(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

// Initialize when DOM is loaded
let professorCalendar
document.addEventListener("DOMContentLoaded", () => {
  professorCalendar = new ProfessorCalendar()
})

// Logout function
function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      window.location.href = "index.html"
    })
}
