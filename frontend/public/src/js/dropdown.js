document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-btn');
    const content = dropdown.querySelector('.dropdown-content');

    // Toggle dropdown on click
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      const isOpen = content.classList.contains('show');

      // Close all other dropdowns
      document.querySelectorAll('.dropdown-content.show').forEach(openContent => {
        openContent.classList.remove('show');
      });

      if (!isOpen) {
        // Position the dropdown
        positionDropdown(button, content);
        content.classList.add('show');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        content.classList.remove('show');
      }
    });
  });

  function positionDropdown(button, content) {
    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const contentWidth = content.offsetWidth || 200; // Fallback width if not rendered
    const padding = 10; // Space from viewport edges

    // Calculate top position (below the button)
    let top = buttonRect.bottom + window.scrollY + 5; // 5px gap below button

    // Calculate left position
    let left = buttonRect.left + window.scrollY;
    let right = viewportWidth - (left + contentWidth);

    // Ensure dropdown stays within viewport
    if (left < padding) {
      left = padding; // Align with left edge
    } else if (right < padding) {
      left = viewportWidth - contentWidth - padding; // Align with right edge
    }

    // Apply positions
    content.style.top = `${top}px`;
    content.style.left = `${left}px`;
  }

  // Reposition on window resize
  window.addEventListener('resize', () => {
    document.querySelectorAll('.dropdown-content.show').forEach(content => {
      const button = content.closest('.dropdown').querySelector('.dropdown-btn');
      positionDropdown(button, content);
    });
  });
});
