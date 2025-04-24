 // Função para calcular o progresso do dia em função das horas passadas
 function updateDayProgress() {
    const now = new Date();
    const totalHours = 24;
    const hoursPassed = now.getHours() + (now.getMinutes() / 60); // Example: 9.5 for 9 hours and 30 minutes
    const progress = (hoursPassed / totalHours) * 100;

    // Update the percentage text
    document.getElementById('progress-percentage').textContent = `${Math.round(progress)}%`;

    // Update the circular progress
    const progressRing = document.querySelector('.plan-progress::before'); // Reference to the pseudo-element for the circle
    const offset = (100 - progress) * (Math.PI * 15.9155) / 100; // Calculate the offset for the circle based on the percentage
    progressRing.style.strokeDashoffset = offset;

    // Update the day name
    const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    document.getElementById('day-name').textContent = dayNames[now.getDay()]; // Display current day
}

// Update every minute to ensure the progress is accurate
setInterval(updateDayProgress, 60000); // 60,000 ms = 1 minute
updateDayProgress(); // Call once on page load