 // Função para calcular o progresso do dia em função das horas passadas
 function updateDayProgress() {
    const now = new Date();
    const totalHours = 24;
    const hoursPassed = now.getHours() + (now.getMinutes() / 60); // Example: 9.5 for 9 hours and 30 minutes
    const progress = (hoursPassed / totalHours) * 100;

    // Update the percentage text
    document.getElementById('progress-percentage').textContent = `${Math.round(progress)}%`;
}

// Update every minute to ensure the progress is accurate
setInterval(updateDayProgress, 60000); // 60,000 ms = 1 minute
updateDayProgress(); // Call once on page load