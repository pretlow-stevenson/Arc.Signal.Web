(() => {
  // Native buttons remain disabled if this local script cannot load. Live store
  // destinations are generated as ordinary links and do not require JavaScript.
  for (const button of document.querySelectorAll('button[data-app-store-stub]')) {
    button.addEventListener('click', () => window.alert('Releasing Fall 2026'));
    button.disabled = false;
  }
})();
