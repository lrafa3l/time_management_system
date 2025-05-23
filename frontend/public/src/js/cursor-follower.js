// Ensure DOM and page are fully loaded
window.addEventListener('load', () => {
  // Create bomb effect on click or touch
  function createBombEffect(x, y) {
    const bomb = document.createElement('div');
    bomb.className = 'bomb';
    bomb.style.left = `${x}px`;
    bomb.style.top = `${y}px`;
    document.body.appendChild(bomb);
    bomb.addEventListener('animationend', () => bomb.remove());
  }

  // Handle mouse clicks
  document.addEventListener('click', (e) => {
    createBombEffect(e.clientX, e.clientY);
  });

  // Handle touch events
  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    createBombEffect(touch.clientX, touch.clientY);
    e.preventDefault(); // Prevent default touch behavior (e.g., scrolling)
  });
});