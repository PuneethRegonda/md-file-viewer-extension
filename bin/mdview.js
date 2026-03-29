#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const url = require('url');
const http = require('http');

const VERSION = '1.0.0';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const MDVIEW_HOME = path.join(os.homedir(), '.mdview');
const VIEWS_DIR = path.join(MDVIEW_HOME, 'views');
const VIEWS_JSON = path.join(MDVIEW_HOME, 'views.json');
const MD_EXT = /\.(md|markdown|mdown)$/i;
const API_PORT = 51437;

// ===== Setup =====
function ensureHome() {
  fs.mkdirSync(VIEWS_DIR, { recursive: true });
  if (!fs.existsSync(VIEWS_JSON)) fs.writeFileSync(VIEWS_JSON, '[]', 'utf-8');
  syncAssets();
}

function syncAssets() {
  [['folder-viewer.html', 'app.html'], [path.join('lib', 'marked.min.js'), 'marked.min.js']].forEach(([s, d]) => {
    const src = path.join(PACKAGE_ROOT, s), dst = path.join(MDVIEW_HOME, d);
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dst) || fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs)
      fs.copyFileSync(src, dst);
  });
}

// ===== Views JSON =====
function readViews() {
  try { return JSON.parse(fs.readFileSync(VIEWS_JSON, 'utf-8')); } catch(e) { return []; }
}

function writeViews(views) {
  fs.writeFileSync(VIEWS_JSON, JSON.stringify(views, null, 2), 'utf-8');
  fs.writeFileSync(path.join(MDVIEW_HOME, 'views-index.js'),
    'window.__MDVIEW_VIEWS = ' + JSON.stringify(views).replace(/<\//g, '<\\/') + ';', 'utf-8');
}

// ===== Helpers =====
function hash(s) { return crypto.createHash('md5').update(s).digest('hex').slice(0, 8); }

function openBrowser(targetUrl) {
  const p = process.platform;
  if (p === 'win32') {
    const r = path.join(os.tmpdir(), 'mdview_open.html');
    fs.writeFileSync(r, `<!DOCTYPE html><script>location="${targetUrl}"</script>`);
    exec(`start "" "${r}"`);
  } else if (p === 'darwin') exec(`open "${targetUrl}"`);
  else exec(`xdg-open "${targetUrl}"`);
}

function openView(viewName) {
  const u = url.pathToFileURL(path.join(MDVIEW_HOME, 'app.html')).href;
  openBrowser(viewName ? u + '?view=' + viewName : u);
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '.next', '.nuxt',
  'dist', 'build', 'out', '.output', 'coverage', '.cache',
  '__pycache__', '.venv', 'venv', '.tox', '.mypy_cache',
  '.gradle', '.idea', '.vs', '.vscode', 'vendor', 'target',
  '.terraform', '.serverless', '.amplify'
]);

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && !MD_EXT.test(entry.name)) {
      if (entry.isDirectory()) continue; // skip dot-directories
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkDir(full));
    } else if (MD_EXT.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ===== Core: create view =====
function createView(targetPath) {
  ensureHome();
  const abs = path.resolve(targetPath);
  if (!fs.existsSync(abs)) { console.error(`Not found: ${abs}`); process.exit(1); }

  const isDir = fs.statSync(abs).isDirectory();
  const files = [];

  if (isDir) {
    walkDir(abs).sort().forEach(full => {
      const rel = path.relative(abs, full);
      const normalized = full.replace(/\\/g, '/');
      files.push({ id: normalized, name: rel.replace(/\\/g, '/'), path: normalized });
    });
  } else if (MD_EXT.test(abs)) {
    const full = abs.replace(/\\/g, '/');
    files.push({ id: full, name: path.basename(abs), path: full });
  }

  if (!files.length) { console.error('No markdown files found.'); process.exit(1); }

  const FILE_LIMIT = 500;
  if (files.length > FILE_LIMIT) {
    console.log(`\n  Found ${files.length} markdown files — that's a lot!`);
    console.log(`  Only the first ${FILE_LIMIT} files will be loaded.`);
    console.log(`  Tip: open a subfolder instead for better performance.\n`);
    files.length = FILE_LIMIT;
  }

  const label = path.basename(abs).replace(MD_EXT, '');
  const viewName = label + '-' + hash(abs);
  const data = { folderName: label, sourcePath: abs.replace(/\\/g, '/'), files };

  fs.writeFileSync(path.join(VIEWS_DIR, viewName + '.js'),
    'window.__MDVIEW_DATA = ' + JSON.stringify(data).replace(/<\//g, '<\\/') + ';', 'utf-8');

  // Update views.json
  const views = readViews();
  const idx = views.findIndex(v => v.viewName === viewName);
  const entry = { viewName, folderName: label, sourcePath: abs.replace(/\\/g, '/'), fileCount: files.length, lastOpened: Date.now() };
  if (idx !== -1) views[idx] = entry; else views.unshift(entry);
  writeViews(views);

  // Update last-view pointer
  fs.writeFileSync(path.join(MDVIEW_HOME, 'last-view.js'),
    'window.__MDVIEW_LAST = ' + JSON.stringify(viewName).replace(/<\//g, '<\\/') + ';', 'utf-8');

  return { viewName, fileCount: files.length };
}

// ===== First run: create sample =====
function createSampleView() {
  ensureHome();
  const sampleDir = path.join(MDVIEW_HOME, 'sample');
  fs.mkdirSync(sampleDir, { recursive: true });

  fs.writeFileSync(path.join(sampleDir, 'Welcome.md'), `# Welcome to MDView

A beautiful markdown viewer for your terminal.

## Quick Start

Open any folder with markdown files:

\`\`\`bash
mdview ./docs/
mdview ~/notes/
mdview README.md
\`\`\`

## Features

- **Dark / Light mode** — follows your system preference
- **Tabbed navigation** — browse multiple files
- **Folder tree** — collapsible sidebar groups
- **Search** — filter files instantly (Ctrl+K)
- **Drag & drop** — add files to the current view
- **View history** — switch between recent views

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Ctrl+K\` | Focus search |
| \`Ctrl+W\` | Close tab |

## Links

- [GitHub](https://github.com/PuneethRegonda/md-file-viewer-extension)
- [npm](https://www.npmjs.com/package/mdview-cli)
`, 'utf-8');

  fs.writeFileSync(path.join(sampleDir, 'Markdown-Cheatsheet.md'), `# Markdown Cheatsheet

## Text Formatting

**Bold text** and *italic text* and ~~strikethrough~~.

## Lists

- Item one
- Item two
  - Nested item
  - Another nested

1. First
2. Second
3. Third

## Code

Inline \`code\` and block:

\`\`\`javascript
function hello() {
  console.log("Hello from MDView!");
}
\`\`\`

## Blockquote

> This is a blockquote.
> It can span multiple lines.

## Table

| Name | Type | Description |
|------|------|-------------|
| mdview | CLI | Markdown viewer |
| npm | Registry | Package manager |

## Task List

- [x] Install MDView
- [x] Open sample view
- [ ] Open your own folder

---

*Generated by MDView v${VERSION}*
`, 'utf-8');

  return createView(sampleDir);
}

// ===== Commands =====
function cmdOpen(targetPath) {
  const { viewName, fileCount } = createView(targetPath);
  console.log(`  ${viewName} (${fileCount} files)`);
  openView(viewName);
}

function cmdOpenLast() {
  ensureHome();
  const views = readViews();
  if (views.length === 0) {
    // First run — create sample
    console.log('  Welcome to MDView! Creating sample view...\n');
    const { viewName } = createSampleView();
    openView(viewName);
  } else {
    openView(views[0].viewName);
  }
}

function cmdList() {
  ensureHome();
  const all = readViews();
  const views = all.filter(v => fs.existsSync(path.join(VIEWS_DIR, v.viewName + '.js')));
  if (views.length !== all.length) writeViews(views);
  if (!views.length) { console.log('  No views. Run: mdview <folder>'); return; }
  console.log(`\n  MDView — ${views.length} view(s)\n`);
  views.forEach(v => {
    const ago = formatAge(v.lastOpened);
    console.log(`  ${v.folderName.padEnd(30)} ${String(v.fileCount).padStart(3)} files   ${ago}`);
  });
  console.log();
}

function cmdReset() {
  ensureHome();
  const files = fs.readdirSync(VIEWS_DIR);
  files.forEach(f => fs.unlinkSync(path.join(VIEWS_DIR, f)));
  writeViews([]);
  try { fs.unlinkSync(path.join(MDVIEW_HOME, 'last-view.js')); } catch(e) {}
  // Also clear sample
  try { fs.rmSync(path.join(MDVIEW_HOME, 'sample'), { recursive: true }); } catch(e) {}
  syncAssets();
  console.log(`  Reset complete. ${files.length} view(s) deleted.`);
}

function formatAge(ms) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ===== Background API Server =====
function runServer() {
  ensureHome();
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const reqUrl = new URL(req.url, `http://localhost:${API_PORT}`);
    const p = reqUrl.pathname;

    // List views
    if (p === '/api/views' && req.method === 'GET') {
      const views = readViews().filter(v => {
        return fs.existsSync(path.join(VIEWS_DIR, v.viewName + '.js'));
      });
      res.end(JSON.stringify(views));
      return;
    }

    // Create view from browser upload
    if (p === '/api/views' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const label = data.folderName || 'Imported';
          const files = data.files || [];
          if (!files.length) { res.writeHead(400); res.end('{"error":"no files"}'); return; }

          const viewName = label + '-' + hash(label + '_' + Date.now());
          const viewData = { folderName: label, sourcePath: 'browser-upload', files };

          fs.writeFileSync(path.join(VIEWS_DIR, viewName + '.js'),
            'window.__MDVIEW_DATA = ' + JSON.stringify(viewData).replace(/<\//g, '<\\/') + ';', 'utf-8');

          const views = readViews();
          const entry = { viewName, folderName: label, sourcePath: 'browser-upload', fileCount: files.length, lastOpened: Date.now() };
          views.unshift(entry);
          writeViews(views);

          fs.writeFileSync(path.join(MDVIEW_HOME, 'last-view.js'),
            'window.__MDVIEW_LAST = ' + JSON.stringify(viewName).replace(/<\//g, '<\\/') + ';', 'utf-8');

          res.end(JSON.stringify({ ok: true, viewName }));
        } catch(e) { res.writeHead(400); res.end('{"error":"invalid json"}'); }
      });
      return;
    }

    // Lazy-load file content from disk
    if (p === '/api/file-content' && req.method === 'GET') {
      const filePath = decodeURIComponent(reqUrl.searchParams.get('path') || '');
      if (!filePath) { res.writeHead(400); res.end('{"error":"missing path"}'); return; }
      // Security: only allow reading .md files
      if (!MD_EXT.test(filePath)) { res.writeHead(403); res.end('{"error":"not a markdown file"}'); return; }
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.end(JSON.stringify({ content }));
      } catch(e) {
        res.writeHead(404); res.end('{"error":"file not found"}');
      }
      return;
    }

    // Delete view
    if (p.startsWith('/api/views/') && req.method === 'DELETE') {
      const name = decodeURIComponent(p.slice('/api/views/'.length));
      const views = readViews();
      const match = views.find(v => v.viewName === name);
      if (!match) { res.writeHead(404); res.end('{"error":"not found"}'); return; }

      // Delete data file
      const f = path.join(VIEWS_DIR, match.viewName + '.js');
      if (fs.existsSync(f)) fs.unlinkSync(f);

      // Update views.json + views-index.js
      const remaining = views.filter(v => v.viewName !== name);
      writeViews(remaining);

      // Update last-view pointer
      if (remaining.length > 0) {
        fs.writeFileSync(path.join(MDVIEW_HOME, 'last-view.js'),
          'window.__MDVIEW_LAST = ' + JSON.stringify(remaining[0].viewName).replace(/<\//g, '<\\/') + ';', 'utf-8');
      } else {
        try { fs.unlinkSync(path.join(MDVIEW_HOME, 'last-view.js')); } catch(e) {}
      }

      res.end(JSON.stringify({ ok: true, remaining }));
      return;
    }

    // Health check
    if (p === '/api/ping') { res.end('{"ok":true}'); return; }

    res.writeHead(404); res.end('{"error":"not found"}');
  });

  server.listen(API_PORT, '127.0.0.1', () => {
    fs.writeFileSync(path.join(MDVIEW_HOME, 'server.pid'), String(process.pid));
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') return; // already running
    console.error('Server error:', e.message);
  });

  // Auto-exit after 2 hours
  setTimeout(() => { try { fs.unlinkSync(path.join(MDVIEW_HOME, 'server.pid')); } catch(e) {} process.exit(0); }, 2 * 60 * 60 * 1000);
  process.on('SIGINT', () => { try { fs.unlinkSync(path.join(MDVIEW_HOME, 'server.pid')); } catch(e) {} process.exit(0); });
  process.on('SIGTERM', () => { try { fs.unlinkSync(path.join(MDVIEW_HOME, 'server.pid')); } catch(e) {} process.exit(0); });
}

// Start server in background (invisible to user)
function ensureServer() {
  return new Promise(resolve => {
    const check = http.get(`http://127.0.0.1:${API_PORT}/api/ping`, (res) => {
      res.resume();
      resolve(); // already running
    });
    check.on('error', () => {
      // Not running — spawn in background
      const child = spawn(process.execPath, [__filename, '--serve'], {
        detached: true, stdio: 'ignore', windowsHide: true
      });
      child.unref();
      setTimeout(resolve, 600); // give it time to start
    });
    check.setTimeout(300, () => check.destroy());
  });
}

function stopServer() {
  return new Promise(resolve => {
    let done = false;
    const finish = (msg) => { if (done) return; done = true; console.log(msg); resolve(); };
    const req = http.get(`http://127.0.0.1:${API_PORT}/api/ping`, (res) => {
      res.resume();
      // Running — kill it
      try {
        const pid = fs.readFileSync(path.join(MDVIEW_HOME, 'server.pid'), 'utf-8').trim();
        process.kill(parseInt(pid));
      } catch(e) {}
      try { fs.unlinkSync(path.join(MDVIEW_HOME, 'server.pid')); } catch(e) {}
      finish('  Server stopped.');
    });
    req.on('error', () => { finish('  Server is not running.'); });
    req.setTimeout(300, () => { req.destroy(); });
  });
}

function showHelp() {
  console.log(`
  MDView v${VERSION}
  Beautiful markdown viewer for the terminal.

  Usage:
    mdview                Open last view (or sample on first run)
    mdview <path>         Open a .md file or folder
    mdview --list         List all saved views
    mdview --reset        Delete all views and start fresh
    mdview --stop         Stop background server
    mdview --version      Show version
    mdview --help         Show this help

  Examples:
    mdview ./docs/
    mdview README.md
    mdview

  Data: ${MDVIEW_HOME}
  `);
}

// ===== Main =====
async function main() {
  const args = process.argv.slice(2);

  // Hidden: run server in foreground (called by background spawn)
  if (args.includes('--serve')) { runServer(); return; }

  if (args.includes('--help') || args.includes('-h')) { showHelp(); return; }
  if (args.includes('--version') || args.includes('-v')) { console.log(`mdview v${VERSION}`); return; }
  if (args.includes('--list') || args.includes('-l')) { cmdList(); return; }
  if (args.includes('--reset')) { cmdReset(); return; }
  if (args.includes('--stop')) { await stopServer(); return; }

  // Start server in background before opening anything
  await ensureServer();

  const target = args.find(a => !a.startsWith('--'));
  if (target) cmdOpen(target);
  else cmdOpenLast();
}

main();
