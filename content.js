(function () {
  'use strict';

  // Only activate on pages that look like raw markdown text
  const contentType = document.contentType;
  const url = window.location.href;
  const isMarkdownURL = /\.(md|markdown|mdown)(\?.*)?$/i.test(url);
  const isPlainText = contentType === 'text/plain' || contentType === 'text/markdown';
  const isLocalFile = url.startsWith('file://');

  // On remote URLs, only activate if content-type is text/plain or text/markdown
  // On local files, activate if the extension matches
  if (!isMarkdownURL) return;
  if (!isLocalFile && !isPlainText) return;

  // Grab the raw text before we replace the DOM
  const rawText = document.body.innerText || document.body.textContent || '';
  if (!rawText.trim()) return;

  // ===== Build the viewer =====

  // Clear existing body content
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';

  // Create viewer root
  const root = document.createElement('div');
  root.className = 'md-viewer-root';

  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('md-viewer-theme') || 'light';
  root.setAttribute('data-theme', savedTheme);

  // Create theme toggle button
  const toggle = document.createElement('button');
  toggle.className = 'md-theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle dark/light mode');
  toggle.setAttribute('title', 'Toggle dark/light mode');
  updateToggleIcon(toggle, savedTheme);

  toggle.addEventListener('click', function () {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('md-viewer-theme', next);
    updateToggleIcon(toggle, next);

    // Sync to extension storage so popup stays in sync
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ theme: next });
    }
  });

  // Render markdown
  const content = document.createElement('div');
  content.className = 'md-content';

  if (typeof marked !== 'undefined') {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    content.innerHTML = marked.parse(rawText);
  } else {
    // Fallback: basic rendering
    content.innerHTML = basicMarkdownRender(rawText);
  }

  root.appendChild(toggle);
  root.appendChild(content);
  document.body.appendChild(root);

  // Listen for theme changes from popup
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes) {
      if (changes.theme) {
        const newTheme = changes.theme.newValue;
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('md-viewer-theme', newTheme);
        updateToggleIcon(toggle, newTheme);
      }
    });
  }

  // ===== Helpers =====

  function updateToggleIcon(btn, theme) {
    btn.textContent = theme === 'light' ? '\u{1F319}' : '\u2600\uFE0F';
  }

  function basicMarkdownRender(text) {
    // Very basic fallback if marked.js fails to load
    let html = escapeHtml(text);
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    return html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
