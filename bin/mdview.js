#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const url = require('url');

const VERSION = '1.0.0';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const MDVIEW_HOME = path.join(os.homedir(), '.mdview');
const VIEWS_DIR = path.join(MDVIEW_HOME, 'views');
const VIEWS_JSON = path.join(MDVIEW_HOME, 'views.json');
const MD_EXT = /\.(md|markdown|mdown)$/i;

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
    'window.__MDVIEW_VIEWS = ' + JSON.stringify(views) + ';', 'utf-8');
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

// ===== Core: create view =====
function createView(targetPath) {
  ensureHome();
  const abs = path.resolve(targetPath);
  if (!fs.existsSync(abs)) { console.error(`Not found: ${abs}`); process.exit(1); }

  const isDir = fs.statSync(abs).isDirectory();
  const files = [];

  if (isDir) {
    fs.readdirSync(abs).filter(f => MD_EXT.test(f)).sort().forEach(f => {
      const full = path.join(abs, f).replace(/\\/g, '/');
      files.push({ id: full, name: f, path: full, content: fs.readFileSync(path.join(abs, f), 'utf-8') });
    });
  } else if (MD_EXT.test(abs)) {
    const full = abs.replace(/\\/g, '/');
    files.push({ id: full, name: path.basename(abs), path: full, content: fs.readFileSync(abs, 'utf-8') });
  }

  if (!files.length) { console.error('No markdown files found.'); process.exit(1); }

  const label = path.basename(abs).replace(MD_EXT, '');
  const viewName = label + '-' + hash(abs);
  const data = { folderName: label, sourcePath: abs.replace(/\\/g, '/'), files };

  fs.writeFileSync(path.join(VIEWS_DIR, viewName + '.js'),
    'window.__MDVIEW_DATA = ' + JSON.stringify(data) + ';', 'utf-8');

  // Update views.json
  const views = readViews();
  const idx = views.findIndex(v => v.viewName === viewName);
  const entry = { viewName, folderName: label, sourcePath: abs.replace(/\\/g, '/'), fileCount: files.length, lastOpened: Date.now() };
  if (idx !== -1) views[idx] = entry; else views.unshift(entry);
  writeViews(views);

  // Update last-view pointer
  fs.writeFileSync(path.join(MDVIEW_HOME, 'last-view.js'),
    `window.__MDVIEW_LAST = "${viewName}";`, 'utf-8');

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
  const views = readViews();
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

function showHelp() {
  console.log(`
  MDView v${VERSION}
  Beautiful markdown viewer for the terminal.

  Usage:
    mdview                Open last view (or sample on first run)
    mdview <path>         Open a .md file or folder
    mdview --list         List all saved views
    mdview --reset        Delete all views and start fresh
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
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) { showHelp(); process.exit(); }
if (args.includes('--version') || args.includes('-v')) { console.log(`mdview v${VERSION}`); process.exit(); }
if (args.includes('--list') || args.includes('-l')) { cmdList(); process.exit(); }
if (args.includes('--reset')) { cmdReset(); process.exit(); }

const target = args.find(a => !a.startsWith('--'));
if (target) cmdOpen(target);
else cmdOpenLast();
