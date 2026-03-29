'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const APPS_DIR = path.join(os.homedir(), '.local', 'share', 'applications');
const DESKTOP_FILE = path.join(APPS_DIR, 'mdview.desktop');

function register() {
  const nodePath = process.execPath;
  const scriptPath = path.resolve(__dirname, '..', 'bin', 'mdview.js');

  fs.mkdirSync(APPS_DIR, { recursive: true });

  const desktop = `[Desktop Entry]
Name=MDView
Comment=Beautiful markdown viewer
Exec="${nodePath}" "${scriptPath}" --protocol %u
Type=Application
Terminal=false
NoDisplay=true
MimeType=x-scheme-handler/mdview;
`;

  fs.writeFileSync(DESKTOP_FILE, desktop, 'utf-8');

  try {
    execSync(`xdg-mime default mdview.desktop x-scheme-handler/mdview`, { stdio: 'ignore' });
  } catch(e) {}

  try {
    execSync(`update-desktop-database "${APPS_DIR}"`, { stdio: 'ignore' });
  } catch(e) {}
}

function unregister() {
  try { fs.unlinkSync(DESKTOP_FILE); } catch(e) {}
  try {
    execSync(`update-desktop-database "${APPS_DIR}"`, { stdio: 'ignore' });
  } catch(e) {}
}

module.exports = { register, unregister };
