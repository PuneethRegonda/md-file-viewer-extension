<p align="center">
  <img src="https://img.shields.io/npm/v/mdview-cli?style=flat-square&color=6366f1" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/mdview-cli?style=flat-square&color=8b5cf6" alt="downloads" />
  <img src="https://img.shields.io/github/stars/PuneethRegonda/md-file-viewer-extension?style=flat-square&color=e3b341" alt="stars" />
  <img src="https://img.shields.io/github/license/PuneethRegonda/md-file-viewer-extension?style=flat-square" alt="license" />
  <img src="https://komarev.com/ghpvc/?username=PuneethRegonda&repo=md-file-viewer-extension&style=flat-square&color=6366f1&label=views" alt="profile views" />
</p>

<h1 align="center">MDView</h1>

<p align="center">
  <strong>Beautiful markdown viewer for the terminal.</strong><br>
  Open <code>.md</code> files and folders in the browser with dark mode, tabbed navigation, and search.
</p>

<p align="center">
  <a href="#install">Install</a> &bull;
  <a href="#usage">Usage</a> &bull;
  <a href="#commands">Commands</a> &bull;
  <a href="#for-ai-agents">For AI Agents</a> &bull;
  <a href="#features">Features</a>
</p>

---

## Install

```bash
npm install -g mdview-cli
```

> Requires Node.js 14+. No other dependencies.

**First run** creates a sample view automatically — just run `mdview` after install.

## Usage

```bash
# Open a folder of markdown files
mdview ./docs/

# Open a single file
mdview README.md

# Open last view (or sample on first run)
mdview

# List saved views
mdview --list

# Start fresh
mdview --reset
```

## Commands

| Command | Description |
|---------|-------------|
| `mdview` | Open last view. Creates a sample on first run. |
| `mdview <path>` | Open a `.md` file or folder. |
| `mdview --list` | List all saved views. |
| `mdview --reset` | Delete all views and start fresh. |
| `mdview --version` | Print version. |
| `mdview --help` | Print help. |

## How It Works

```
mdview ./docs/
  ↓
Scans for .md files
  ↓
Saves view data to ~/.mdview/views/
  ↓
Opens app.html in your default browser
  ↓
Markdown rendered beautifully with tabs, search, dark mode
```

Views persist across sessions. Run `mdview` anytime to reopen.

## Data Directory

```
~/.mdview/
├── app.html            # Viewer app (auto-updated)
├── marked.min.js       # Markdown parser
├── views.json          # View registry
└── views/
    ├── docs-a1b2c3d4.js
    └── notes-e5f6g7h8.js
```

---

## For AI Agents

MDView is built for AI coding agents (Claude Code, GitHub Copilot, Cursor, etc.) to present markdown documentation to users in a readable format.

### Quick Integration

```bash
# One-time install
npm install -g mdview-cli

# Open docs for the user
mdview /path/to/docs/

# Open a specific file
mdview /path/to/README.md

# Open last view
mdview

# List views
mdview --list

# Clean slate
mdview --reset
```

### Why Use MDView in Your Agent

| Benefit | Detail |
|---------|--------|
| **Zero config** | One command, opens in browser |
| **No server** | Pure `file://` protocol, works offline |
| **Cross-platform** | Windows, macOS, Linux |
| **Non-blocking** | CLI returns immediately |
| **Persistent** | Views survive terminal sessions |
| **Dark mode** | Follows system preference |
| **Self-contained** | No runtime dependencies |

### Agent Workflow Example

```
User: "Show me the API documentation"

Agent runs: mdview ./docs/api/

→ Browser opens with all .md files in a tabbed, searchable viewer
→ User reads docs with dark mode, search, and navigation
→ Agent's terminal is free for next command
```

### CLAUDE.md Integration

Add this to your project's `CLAUDE.md` to enable MDView:

```markdown
## Documentation Viewer
When the user asks to see documentation, use `mdview`:
- `mdview ./docs/` — open the docs folder
- `mdview README.md` — open a specific file
- `mdview` — reopen the last view
```

---

## Features

- **Dark / Light mode** — follows system preference, one-click toggle
- **Tabbed navigation** — open multiple files as tabs, close with Ctrl+W
- **Folder tree** — collapsible sidebar with folder groups
- **Search** — instant file filter with Ctrl+K
- **Drag & drop** — add .md files by dragging onto the viewer
- **View history** — slide-out drawer to switch between views
- **Context menus** — right-click for copy path, rename, delete
- **Smooth transitions** — fade animations between views
- **First-run sample** — welcome view with getting started guide
- **GFM support** — tables, task lists, code blocks, blockquotes, images

## Browser Support

Works in any browser: Chrome, Edge, Firefox, Brave, Safari.

## Contributing

```bash
git clone https://github.com/PuneethRegonda/md-file-viewer-extension.git
cd md-file-viewer-extension
npm link    # makes 'mdview' available globally from source
```

## Support

<a href="https://buymeacoffee.com/puneethregonda">
  <img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-yellow?style=flat-square" alt="Buy me a coffee" />
</a>

## License

[MIT](LICENSE) — [Puneeth Regonda](https://github.com/PuneethRegonda)
