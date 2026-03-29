document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('themeToggle');
  const label = document.getElementById('themeText');

  function applyTheme(theme) {
    document.body.className = theme;
    toggle.checked = theme === 'dark';
    label.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  }

  // Load current theme
  chrome.storage.local.get('theme', function (data) {
    applyTheme(data.theme || 'light');
  });

  // Toggle theme
  toggle.addEventListener('change', function () {
    const theme = toggle.checked ? 'dark' : 'light';
    chrome.storage.local.set({ theme: theme });
    applyTheme(theme);
  });
});
