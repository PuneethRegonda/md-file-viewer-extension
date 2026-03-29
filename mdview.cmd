@echo off
setlocal enabledelayedexpansion
:: mdview - Open markdown files in Chrome/browser with beautiful rendering
:: Usage:
::   mdview <file.md>       Open a single markdown file
::   mdview <folder>        Open all .md files in folder with tabs

:: Resolve extension directory relative to this script
set "EXT_DIR=%~dp0"
:: Remove trailing backslash
if "%EXT_DIR:~-1%"=="\" set "EXT_DIR=%EXT_DIR:~0,-1%"

:: Check for manifest.json to confirm extension location
if not exist "%EXT_DIR%\manifest.json" (
    :: Try parent lib directory
    if exist "%EXT_DIR%\..\lib\md-file-viewer-extension\manifest.json" (
        set "EXT_DIR=%EXT_DIR%\..\lib\md-file-viewer-extension"
    ) else (
        echo Error: Could not find md-file-viewer-extension installation.
        exit /b 1
    )
)

if "%~1"=="" (
    echo mdview - Beautiful Markdown Viewer
    echo.
    echo Usage:
    echo   mdview ^<file.md^>       Open a single markdown file
    echo   mdview ^<folder^>        Open all .md files in a folder with tabs
    echo.
    echo Examples:
    echo   mdview README.md
    echo   mdview .\docs\
    exit /b 1
)

:: Find Python
set "PYTHON="
where python3 >nul 2>&1 && set "PYTHON=python3" && goto :found_python
where python >nul 2>&1 && set "PYTHON=python" && goto :found_python
where py >nul 2>&1 && set "PYTHON=py" && goto :found_python

echo Error: Python 3 is required but not found.
echo Install Python from https://www.python.org/downloads/
exit /b 1

:found_python
set "TARGET=%~f1"

:: Check if directory
if exist "%TARGET%\*" goto :folder_mode

:: ===== SINGLE FILE MODE =====
if not exist "%TARGET%" (
    echo Error: Not a file or folder: %TARGET%
    exit /b 1
)

echo Opening: %TARGET%
call :open_browser "file:///%TARGET:\=/%"
goto :eof

:: ===== FOLDER MODE =====
:folder_mode
echo Scanning folder: %TARGET%

set "TEMP_HTML=%TEMP%\mdview_%RANDOM%.html"

%PYTHON% -c "
import json, os, sys, glob

target = sys.argv[1]
ext_dir = sys.argv[2]
output = sys.argv[3]

patterns = ['*.md', '*.markdown', '*.mdown']
files = []
for p in patterns:
    for f in sorted(glob.glob(os.path.join(target, p))):
        name = os.path.basename(f)
        fpath = os.path.abspath(f).replace('\\\\', '/')
        if not any(x['id'] == fpath for x in files):
            with open(f, 'r', encoding='utf-8', errors='replace') as fh:
                files.append({'id': fpath, 'name': name, 'path': fpath, 'content': fh.read()})

if not files:
    print('No markdown files found.')
    sys.exit(1)

print(f'Found {len(files)} markdown file(s)')

folder_name = os.path.basename(target)
marked_path = 'file:///' + os.path.join(ext_dir, 'lib', 'marked.min.js').replace('\\', '/')

with open(os.path.join(ext_dir, 'folder-viewer.html'), 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('{{FOLDER_NAME}}', folder_name)
html = html.replace('{{FILES_JSON}}', json.dumps(files))
html = html.replace('{{MARKED_PATH}}', marked_path)

with open(output, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Generated: {output}')
" "%TARGET%" "%EXT_DIR%" "%TEMP_HTML%"

if not exist "%TEMP_HTML%" (
    echo Error: Failed to generate viewer HTML
    exit /b 1
)

echo Opening folder viewer...
call :open_browser "file:///%TEMP_HTML:\=/%"
goto :eof

:: ===== BROWSER LAUNCHER =====
:open_browser
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%~1"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "%~1"
) else (
    start "" "%~1"
)
goto :eof
