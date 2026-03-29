'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const APP_DIR = path.join(os.homedir(), 'Applications', 'MDView.app');
const CONTENTS = path.join(APP_DIR, 'Contents');
const MACOS_DIR = path.join(CONTENTS, 'MacOS');

function register() {
  const nodePath = process.execPath;
  const scriptPath = path.resolve(__dirname, '..', 'bin', 'mdview.js');

  fs.mkdirSync(MACOS_DIR, { recursive: true });

  // Info.plist
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.mdview.protocol</string>
  <key>CFBundleName</key>
  <string>MDView</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleExecutable</key>
  <string>mdview-handler</string>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key>
      <string>MDView Protocol</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>mdview</string>
      </array>
    </dict>
  </array>
</dict>
</plist>`;

  fs.writeFileSync(path.join(CONTENTS, 'Info.plist'), plist, 'utf-8');

  // Executable script
  const handler = `#!/bin/bash
exec "${nodePath}" "${scriptPath}" --protocol "$1"
`;
  const handlerPath = path.join(MACOS_DIR, 'mdview-handler');
  fs.writeFileSync(handlerPath, handler, 'utf-8');
  fs.chmodSync(handlerPath, '755');

  // Register with Launch Services
  try {
    execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -R "${APP_DIR}"`, { stdio: 'ignore' });
  } catch(e) {
    // lsregister may not be available in all macOS versions
  }
}

function unregister() {
  try {
    execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -u "${APP_DIR}"`, { stdio: 'ignore' });
  } catch(e) {}
  try {
    fs.rmSync(APP_DIR, { recursive: true, force: true });
  } catch(e) {}
}

module.exports = { register, unregister };
