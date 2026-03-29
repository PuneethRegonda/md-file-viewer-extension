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

:: Persistent mdview home
set "MDVIEW_HOME=%USERPROFILE%\.mdview"
if not exist "%MDVIEW_HOME%\views" mkdir "%MDVIEW_HOME%\views"

:: Copy app files
copy /y "%EXT_DIR%\folder-viewer.html" "%MDVIEW_HOME%\app.html" >nul
copy /y "%EXT_DIR%\lib\marked.min.js" "%MDVIEW_HOME%\marked.min.js" >nul

:: Get view name from Python (it prints VIEW_NAME as last line)
for /f "delims=" %%V in ('%PYTHON% -c "
import json, os, sys, glob, hashlib
target = sys.argv[1]
mdview_home = sys.argv[2]
folder_name = os.path.basename(target)
hash8 = hashlib.md5(os.path.abspath(target).encode()).hexdigest()[:8]
view_name = folder_name + chr(45) + hash8
output = os.path.join(mdview_home, 'views', view_name + '.js')
patterns = ['*.md', '*.markdown', '*.mdown']
files = []
for p in patterns:
    for f in sorted(glob.glob(os.path.join(target, p))):
        name = os.path.basename(f)
        fpath = os.path.abspath(f).replace(chr(92), '/')
        if not any(x['id'] == fpath for x in files):
            with open(f, 'r', encoding='utf-8', errors='replace') as fh:
                files.append({'id': fpath, 'name': name, 'path': fpath, 'content': fh.read()})
if not files:
    print('NO_FILES')
    sys.exit(0)
data = {'folderName': folder_name, 'sourcePath': os.path.abspath(target).replace(chr(92), '/'), 'files': files}
with open(output, 'w', encoding='utf-8') as f:
    f.write('window.__MDVIEW_DATA = ')
    json.dump(data, f)
    f.write(';')
print(view_name)
" "%TARGET%" "%MDVIEW_HOME%"') do set "VIEW_NAME=%%V"

if "%VIEW_NAME%"=="NO_FILES" (
    echo No markdown files found.
    exit /b 1
)

if "%VIEW_NAME%"=="" (
    echo Error: Failed to generate view data
    exit /b 1
)

echo Opening: %VIEW_NAME%
call :open_browser "file:///%MDVIEW_HOME:\=/%/app.html?view=%VIEW_NAME%"
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
