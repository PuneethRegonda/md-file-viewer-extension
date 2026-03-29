# MD File Viewer

A Chrome extension and CLI tool for reading Markdown files with dark/light mode and GitHub-style tabbed folder view.

## Features

- Dark / Light mode with one-click toggle
- Folder view — open all `.md` files in a directory with tabbed navigation
- Smart link handling — `.md` links open in the same view as tabs
- Drag & drop `.md` files to add them to the current view
- Keyboard shortcuts: `Ctrl+K` search, `Ctrl+W` close tab
- GFM support (tables, task lists, code blocks, etc.)
- Cross-platform CLI (`mdview`)

## Install

### Chrome Extension

```bash
git clone https://github.com/PuneethRegonda/md-file-viewer-extension.git
```

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select the cloned folder
4. In extension details, enable **Allow access to file URLs**

### CLI

```bash
# Linux / macOS
sudo ln -s "$(pwd)/md-file-viewer-extension/mdview.sh" /usr/local/bin/mdview

# Windows (Git Bash)
cp mdview.sh ~/bin/mdview && cp mdview.cmd ~/bin/mdview.cmd
```

Requires **Python 3** for folder mode.

## Usage

```bash
mdview README.md          # single file
mdview ./docs/            # folder with tabs
```

## License

[MIT](LICENSE)
