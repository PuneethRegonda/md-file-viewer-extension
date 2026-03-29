#!/bin/bash
# mdview - Open markdown files in Chrome/browser with beautiful rendering
#
# Usage:
#   mdview <file.md>       Open a single markdown file
#   mdview <folder>        Open all .md files in folder with tabbed UI
#
# Works on: Windows (Git Bash/MSYS2), macOS, Linux

# Resolve extension directory relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# If installed via symlink or copy, check for EXT_DIR marker
if [ -f "$SCRIPT_DIR/manifest.json" ]; then
  EXT_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../lib/md-file-viewer-extension/manifest.json" ]; then
  EXT_DIR="$SCRIPT_DIR/../lib/md-file-viewer-extension"
else
  # Fallback: look for extension in common install locations
  for d in \
    "$HOME/.md-file-viewer-extension" \
    "$HOME/.local/share/md-file-viewer-extension" \
    "/usr/local/share/md-file-viewer-extension"; do
    if [ -f "$d/manifest.json" ]; then
      EXT_DIR="$d"
      break
    fi
  done
fi

if [ -z "$EXT_DIR" ] || [ ! -f "$EXT_DIR/folder-viewer.html" ]; then
  echo "Error: Could not find md-file-viewer-extension installation."
  echo "Make sure the extension directory contains folder-viewer.html and manifest.json."
  exit 1
fi

if [ -z "$1" ]; then
  echo "mdview - Beautiful Markdown Viewer"
  echo ""
  echo "Usage:"
  echo "  mdview <file.md>       Open a single markdown file"
  echo "  mdview <folder>        Open all .md files in a folder with tabs"
  echo ""
  echo "Examples:"
  echo "  mdview README.md"
  echo "  mdview ./docs/"
  exit 1
fi

TARGET="$1"

# Resolve to absolute path
if [[ "$TARGET" != /* ]] && [[ "$TARGET" != ?:/* ]] && [[ "$TARGET" != ?:\\* ]]; then
  if [ -d "$TARGET" ]; then
    TARGET="$(cd "$TARGET" && pwd)"
  else
    TARGET="$(cd "$(dirname "$TARGET")" && pwd)/$(basename "$TARGET")"
  fi
fi

# ===== Detect OS =====
detect_os() {
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    Darwin*)               echo "macos" ;;
    Linux*)                echo "linux" ;;
    *)                     echo "unknown" ;;
  esac
}

OS="$(detect_os)"

# ===== Find Python =====
find_python() {
  for cmd in python3 python py; do
    if command -v "$cmd" &>/dev/null; then
      echo "$cmd"
      return
    fi
  done
  echo ""
}

PYTHON="$(find_python)"
if [ -z "$PYTHON" ]; then
  echo "Error: Python 3 is required but not found."
  echo "Install Python from https://www.python.org/downloads/"
  exit 1
fi

# ===== Open in browser =====
open_in_browser() {
  local URL="$1"
  case "$OS" in
    windows)
      if [ -f "/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
        "/c/Program Files/Google/Chrome/Application/chrome.exe" "$URL" &
      elif [ -f "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" ]; then
        "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" "$URL" &
      else
        start "" "$URL" 2>/dev/null || cmd.exe /c start "$URL"
      fi
      ;;
    macos)
      if [ -d "/Applications/Google Chrome.app" ]; then
        open -a "Google Chrome" "$URL"
      else
        open "$URL"
      fi
      ;;
    linux)
      if command -v google-chrome &>/dev/null; then
        google-chrome "$URL" &
      elif command -v google-chrome-stable &>/dev/null; then
        google-chrome-stable "$URL" &
      elif command -v chromium-browser &>/dev/null; then
        chromium-browser "$URL" &
      elif command -v xdg-open &>/dev/null; then
        xdg-open "$URL" &
      else
        echo "No browser found. Open manually: $URL"
      fi
      ;;
    *)
      echo "Open manually: $URL"
      ;;
  esac
}

# ===== Convert path to file:// URL =====
to_file_url() {
  local P="$1"
  case "$OS" in
    windows)
      # Convert /c/Users/... to file:///C:/Users/...
      echo "file:///$(echo "$P" | sed 's|^/\([a-zA-Z]\)/|\1:/|' | sed 's|\\|/|g')"
      ;;
    *)
      echo "file://$P"
      ;;
  esac
}

# ===== Get temp directory =====
get_temp_dir() {
  case "$OS" in
    windows)
      local wintemp
      wintemp="$(cmd //c echo %TEMP% 2>/dev/null | tr -d '\r')"
      if [ -n "$wintemp" ] && [ -d "$wintemp" ]; then
        echo "$wintemp"
      else
        echo "${TMPDIR:-/tmp}"
      fi
      ;;
    *)
      echo "${TMPDIR:-/tmp}"
      ;;
  esac
}

# ===== FOLDER MODE =====
if [ -d "$TARGET" ]; then
  echo "Scanning folder: $TARGET"

  # Find all .md files
  MD_FILES=()
  while IFS= read -r -d '' f; do
    MD_FILES+=("$f")
  done < <(find "$TARGET" -maxdepth 1 -type f \( -iname "*.md" -o -iname "*.markdown" -o -iname "*.mdown" \) -print0 | sort -z)

  if [ ${#MD_FILES[@]} -eq 0 ]; then
    echo "No markdown files found in: $TARGET"
    exit 1
  fi

  echo "Found ${#MD_FILES[@]} markdown file(s)"

  FOLDER_NAME="$(basename "$TARGET")"
  MARKED_PATH="$(to_file_url "$EXT_DIR/lib/marked.min.js")"
  TEMP_DIR="$(get_temp_dir)"
  TEMP_HTML="$TEMP_DIR/mdview_${FOLDER_NAME}_$$.html"

  # Let Python handle all file reading, JSON building, and template injection
  "$PYTHON" -c "
import json, os, sys, glob

target = sys.argv[1]
ext_dir = sys.argv[2]
output = sys.argv[3]
folder_name = sys.argv[4]
marked_path = sys.argv[5]

patterns = ['*.md', '*.markdown', '*.mdown']
files = []
for p in patterns:
    for f in sorted(glob.glob(os.path.join(target, p))):
        name = os.path.basename(f)
        if not any(x['name'] == name for x in files):
            with open(f, 'r', encoding='utf-8', errors='replace') as fh:
                files.append({'name': name, 'content': fh.read()})

with open(os.path.join(ext_dir, 'folder-viewer.html'), 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('{{FOLDER_NAME}}', folder_name)
html = html.replace('{{FILES_JSON}}', json.dumps(files))
html = html.replace('{{MARKED_PATH}}', marked_path)

with open(output, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Generated: {output}')
" "$TARGET" "$EXT_DIR" "$TEMP_HTML" "$FOLDER_NAME" "$MARKED_PATH"

  if [ ! -f "$TEMP_HTML" ]; then
    echo "Error: Failed to generate viewer HTML"
    exit 1
  fi

  FILE_URL="$(to_file_url "$TEMP_HTML")"
  echo "Opening: $FILE_URL"
  open_in_browser "$FILE_URL"
  exit 0
fi

# ===== SINGLE FILE MODE =====
if [ ! -f "$TARGET" ]; then
  echo "Error: Not a file or folder: $TARGET"
  exit 1
fi

case "$TARGET" in
  *.md|*.markdown|*.mdown) ;;
  *)
    echo "Warning: File doesn't have a markdown extension, opening anyway..."
    ;;
esac

FILE_URL="$(to_file_url "$TARGET")"
echo "Opening: $FILE_URL"
open_in_browser "$FILE_URL"
