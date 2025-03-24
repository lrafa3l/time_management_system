document.querySelector('.dropdown-btn').addEventListener('click', function(e) {
    e.preventDefault();
    this.parentElement.classList.toggle('active');
});

// Fechar o dropdown se clicar fora dele
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelector('.dropdown').classList.remove('active');
    }
});