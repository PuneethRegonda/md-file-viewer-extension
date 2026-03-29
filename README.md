# MD File Viewer

A beautiful, minimal Chrome extension and CLI tool for reading Markdown files — with dark/light mode, GitHub-style tabbed folder view, and cross-platform support.

> Stop reading raw `.md` files in your browser. Open them beautifully.

---

## Features

- **Single file rendering** — Open any `.md` file in Chrome with clean, readable typography
- **Folder view with tabs** — Open a folder of `.md` files in a GitHub-style tabbed interface with sidebar navigation
- **Dark / Light mode** — Toggle between themes with one click; your preference is remembered
- **CLI tool** — Open markdown files directly from your terminal with `mdview`
- **GFM support** — Tables, task lists, fenced code blocks, strikethrough, and more
- **Drag & drop** — Drag `.md` files directly into the viewer to open them as new tabs
- **Keyboard shortcuts** — `Ctrl+K` to search files, `Ctrl+W` to close tabs
- **Cross-platform** — Works on Windows, macOS, and Linux
- **Zero dependencies** — No build step, no npm, no bundler. Just load and go.

---

## Screenshots

### Light Mode — Folder View
```
+------------------+----------------------------------------+
|  Sidebar         |  Tab Bar: [README.md] [GUIDE.md]       |
|  - README.md     |----------------------------------------|
|  - GUIDE.md      |  # My Project                          |
|  - CHANGELOG.md  |                                        |
|  [Search...]     |  A beautiful markdown viewer...         |
+------------------+----------------------------------------+
```

### Dark Mode — Single File
```
+--------------------------------------------------------+
|                                          [Toggle]       |
|  # Document Title                                       |
|                                                         |
|  Beautifully rendered markdown with syntax              |
|  highlighting, tables, and more.                        |
+--------------------------------------------------------+
```

---

## Installation

### Chrome Extension (for single-file rendering)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/PuneethRegonda/md-file-viewer-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (top-right toggle)

4. Click **Load unpacked** and select the cloned folder

5. Click the extension's **Details** button and enable **Allow access to file URLs**

### CLI Tool (for terminal usage)

#### Quick Install (all platforms)

```bash
# Clone the repo
git clone https://github.com/PuneethRegonda/md-file-viewer-extension.git

# Add to PATH (choose one)

# Linux / macOS:
sudo ln -s "$(pwd)/md-file-viewer-extension/mdview.sh" /usr/local/bin/mdview

# Or add to your shell profile:
echo 'export PATH="$PATH:/path/to/md-file-viewer-extension"' >> ~/.bashrc
```

#### Windows

```cmd
:: Option 1: Add the extension folder to your PATH
setx PATH "%PATH%;C:\path\to\md-file-viewer-extension"

:: Option 2: Copy to a directory already in PATH
copy mdview.cmd C:\Users\%USERNAME%\bin\mdview.cmd
copy mdview.sh C:\Users\%USERNAME%\bin\mdview
```

### Requirements

- **Chrome** (or any Chromium-based browser) for viewing
- **Python 3** for folder mode (generates the tabbed viewer HTML)

---

## Usage

### From the terminal

```bash
# Open a single markdown file
mdview README.md

# Open all markdown files in a folder (tabbed UI)
mdview ./docs/

# Works with any path
mdview /path/to/project/CHANGELOG.md
mdview C:\Users\me\notes\
```

### From Chrome

Just open any `.md` file in Chrome — the extension automatically detects it and renders it beautifully. Use the moon/sun button in the top-right to toggle dark mode.

### Keyboard Shortcuts (Folder View)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Focus the file search box |
| `Ctrl+W` / `Cmd+W` | Close the active tab |
| Drag & drop `.md` files | Opens them as new tabs |

---

## How It Works

### Single File Mode
The Chrome extension uses a content script that detects when you open a `.md` file. It reads the raw text, parses it with [marked.js](https://github.com/markedjs/marked) (GFM-enabled), and replaces the page with a beautifully styled document.

### Folder Mode
The CLI tool scans the target directory for markdown files, reads their contents, and generates a self-contained HTML file with an embedded tabbed viewer. This file is opened in your browser — **no extension required** for folder mode.

---

## Project Structure

```
md-file-viewer-extension/
├── manifest.json          # Chrome Extension Manifest V3
├── content.js             # Content script — detects & renders .md files
├── styles.css             # Single-file viewer styles (dark + light)
├── popup.html             # Extension popup UI
├── popup.js               # Popup theme toggle logic
├── folder-viewer.html     # Folder view template (GitHub-style tabs)
├── mdview.sh              # CLI tool (bash — macOS/Linux/Git Bash)
├── mdview.cmd             # CLI tool (Windows CMD/PowerShell)
├── lib/
│   └── marked.min.js      # Markdown parser (MIT licensed)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE                 # MIT License
└── README.md
```

---

## Supported Markdown Features

| Feature | Supported |
|---------|-----------|
| Headings (h1–h6) | Yes |
| Bold, italic, strikethrough | Yes |
| Links | Yes |
| Images | Yes |
| Fenced code blocks | Yes |
| Inline code | Yes |
| Tables (GFM) | Yes |
| Task lists | Yes |
| Blockquotes | Yes |
| Horizontal rules | Yes |
| Nested lists | Yes |
| HTML in markdown | Yes |

---

## Browser Compatibility

| Browser | Single File | Folder View |
|---------|-------------|-------------|
| Google Chrome | Yes | Yes |
| Microsoft Edge | Yes | Yes |
| Brave | Yes | Yes |
| Chromium | Yes | Yes |
| Firefox | No (Manifest V3) | Yes (CLI only) |
| Safari | No | Yes (CLI only) |

---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test on at least one platform (Windows/macOS/Linux)
5. Submit a pull request

### Ideas for Contributions

- Syntax highlighting for code blocks (e.g., Prism.js or Highlight.js)
- Recursive folder scanning (nested directories)
- Print-friendly styles
- Export to PDF
- File watching / live reload
- Custom themes
- Firefox extension port (Manifest V2)

---

## License

[MIT](LICENSE) — Puneeth Regonda

---

## Acknowledgments

- [marked.js](https://github.com/markedjs/marked) — Fast markdown parser (MIT)
- Inspired by GitHub's markdown rendering

---

**Made with care for people who read a lot of markdown.**
