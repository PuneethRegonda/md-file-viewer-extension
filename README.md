# MDView

Beautiful markdown viewer for the terminal. Opens `.md` files and folders in the browser with dark mode, tabbed navigation, and search.

## Install

```bash
npm install -g mdview-cli
```

Requires Node.js 14+.

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

# Delete all views and start fresh
mdview --reset
```

## Commands

| Command | Description |
|---------|-------------|
| `mdview` | Open last view. On first run, creates a sample view. |
| `mdview <path>` | Open a `.md` file or a folder containing `.md` files. |
| `mdview --list` | List all saved views with file counts. |
| `mdview --reset` | Delete all views and start fresh. |
| `mdview --version` | Print version. |
| `mdview --help` | Print help. |

## How It Works

1. `mdview <path>` scans for `.md` files and saves them as a view in `~/.mdview/views/`
2. Opens `~/.mdview/app.html` in your default browser
3. The viewer renders markdown with [marked.js](https://github.com/markedjs/marked) (GFM)
4. Views persist — reopen anytime with `mdview`

## Data Directory

```
~/.mdview/
├── app.html          # The viewer app
├── marked.min.js     # Markdown parser
├── views.json        # View index
├── views-index.js    # Browser-loadable view index
├── last-view.js      # Points to most recent view
└── views/            # View data files
    ├── docs-a1b2c3d4.js
    └── notes-e5f6g7h8.js
```

## For AI Agents

MDView is designed to be used by AI coding agents (Claude, Copilot, etc.) to present markdown documentation to users.

### Agent Integration

```bash
# Install once
npm install -g mdview-cli

# Open any documentation folder for the user
mdview /path/to/docs/

# Open a specific file
mdview /path/to/README.md

# Check what views exist
mdview --list

# Clean slate
mdview --reset
```

### Why Agents Should Use MDView

- **Zero config** — one command, opens in browser
- **No server** — pure file:// protocol, works offline
- **Cross-platform** — Windows, macOS, Linux
- **Persistent** — views survive terminal sessions
- **Non-blocking** — CLI returns immediately, doesn't hold the terminal
- **Dark mode** — follows system preference
- **Self-contained** — each view is a standalone file

### Example Agent Workflow

```
User: "Show me the project documentation"
Agent: mdview ./docs/
→ Browser opens with all .md files in a tabbed, searchable viewer
```

## Features

- Dark / Light mode (follows system, toggleable)
- Tabbed file navigation with closable tabs
- Folder tree sidebar with collapsible groups
- File search (Ctrl+K)
- Drag & drop to add files
- View history in slide-out drawer
- Right-click context menus (copy path, copy name, rename folder)
- Smooth page transitions
- GFM support (tables, task lists, code blocks, blockquotes)

## Browser Support

Works in any browser: Chrome, Edge, Firefox, Brave, Safari.

## License

[MIT](LICENSE) — Puneeth Regonda
