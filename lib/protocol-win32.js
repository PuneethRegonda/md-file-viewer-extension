'use strict';
const { execSync } = require('child_process');
const path = require('path');

function register() {
  const nodePath = process.execPath;
  const scriptPath = path.resolve(__dirname, '..', 'bin', 'mdview.js');
  // Escape backslashes and quotes for registry
  const command = `"${nodePath}" "${scriptPath}" --protocol "%1"`;

  execSync(`reg add "HKCU\\Software\\Classes\\mdview" /ve /d "URL:MDView Protocol" /f`, { stdio: 'ignore' });
  execSync(`reg add "HKCU\\Software\\Classes\\mdview" /v "URL Protocol" /t REG_SZ /d "" /f`, { stdio: 'ignore' });
  execSync(`reg add "HKCU\\Software\\Classes\\mdview\\shell" /ve /d "" /f`, { stdio: 'ignore' });
  execSync(`reg add "HKCU\\Software\\Classes\\mdview\\shell\\open" /ve /d "" /f`, { stdio: 'ignore' });
  execSync(`reg add "HKCU\\Software\\Classes\\mdview\\shell\\open\\command" /ve /d "${command.replace(/"/g, '\\"')}" /f`, { stdio: 'ignore' });
}

function unregister() {
  try {
    execSync(`reg delete "HKCU\\Software\\Classes\\mdview" /f`, { stdio: 'ignore' });
  } catch(e) {
    // Key may not exist
  }
}

module.exports = { register, unregister };
