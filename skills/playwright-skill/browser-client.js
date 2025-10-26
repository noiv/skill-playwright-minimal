#!/usr/bin/env node
/**
 * Client for browser daemon
 * Sends commands and waits for results
 */

const fs = require('fs');
const path = require('path');

const COMMAND_FILE = path.join(__dirname, '.browser-command');
const RESULT_FILE = path.join(__dirname, '.browser-result');
const READY_FILE = path.join(__dirname, '.browser-ready');

function checkDaemonRunning() {
  if (!fs.existsSync(READY_FILE)) {
    console.error('Browser daemon not running!');
    console.error('Start it with: node browser-daemon.js');
    process.exit(1);
  }
}

function sendCommand(command) {
  // Delete old result
  if (fs.existsSync(RESULT_FILE)) {
    fs.unlinkSync(RESULT_FILE);
  }

  // Write command
  fs.writeFileSync(COMMAND_FILE, JSON.stringify(command));

  // Wait for result (with timeout)
  const startTime = Date.now();
  const timeout = 30000; // 30 seconds

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (fs.existsSync(RESULT_FILE)) {
        clearInterval(checkInterval);
        const result = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
        fs.unlinkSync(RESULT_FILE);
        resolve(result);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Command timeout'));
      }
    }, 50);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  checkDaemonRunning();

  try {
    let command, result;

    switch (action) {
      case 'navigate':
        const url = args[1];
        if (!url) {
          console.error('Usage: node browser-client.js navigate <url>');
          process.exit(1);
        }
        command = { action: 'navigate', data: { url } };
        result = await sendCommand(command);

        if (result.success) {
          console.log('Navigated successfully!');
          console.log('URL:', result.url);
          console.log('Title:', result.title);
        } else {
          console.error('Error:', result.error);
        }
        break;

      case 'exec':
        const code = args[1];
        if (!code) {
          console.error('Usage: node browser-client.js exec "javascript code"');
          process.exit(1);
        }
        command = { action: 'exec', data: { code } };
        result = await sendCommand(command);

        if (result.success) {
          console.log('Result:');
          if (typeof result.result === 'object') {
            console.log(JSON.stringify(result.result, null, 2));
          } else {
            console.log(result.result);
          }
        } else {
          console.error('Error:', result.error);
        }
        break;

      case 'console':
        command = { action: 'console', data: {} };
        result = await sendCommand(command);

        if (result.success) {
          console.log('Console logs (' + result.logs.length + ' entries):');
          console.log('');
          result.logs.forEach(log => {
            const prefix = {
              'log': 'LOG',
              'info': 'INFO',
              'warn': 'WARN',
              'error': 'ERROR',
              'debug': 'DEBUG',
              'pageerror': 'PAGEERROR'
            }[log.type] || 'MSG';
            console.log(`${prefix} [${log.type.toUpperCase()}] ${log.text}`);
            if (log.location && log.location.url) {
              console.log(`   └─ ${log.location.url}:${log.location.lineNumber}`);
            }
          });
        } else {
          console.error('Error:', result.error);
        }
        break;

      case 'console-clear':
        command = { action: 'console-clear', data: {} };
        result = await sendCommand(command);
        console.log('Console logs cleared');
        break;

      case 'status':
        command = { action: 'status', data: {} };
        result = await sendCommand(command);

        if (result.success) {
          console.log('Browser daemon is running');
          console.log('Current URL:', result.url);
          console.log('Current title:', result.title);
          console.log('Console logs:', result.consoleLogsCount);
        } else {
          console.error('Error:', result.error);
        }
        break;

      case 'resize':
        const width = parseInt(args[1]);
        const height = parseInt(args[2]);
        if (!width || !height) {
          console.error('Usage: node browser-client.js resize <width> <height>');
          process.exit(1);
        }
        command = { action: 'resize', data: { width, height } };
        result = await sendCommand(command);

        if (result.success) {
          console.log('Viewport resized!');
          console.log('New size:', result.width, 'x', result.height);
        } else {
          console.error('Error:', result.error);
        }
        break;

      default:
        console.log('Browser Daemon Client');
        console.log('');
        console.log('Usage:');
        console.log('  node browser-client.js navigate <url>');
        console.log('  node browser-client.js exec "javascript code"');
        console.log('  node browser-client.js console');
        console.log('  node browser-client.js console-clear');
        console.log('  node browser-client.js resize <width> <height>');
        console.log('  node browser-client.js status');
        process.exit(1);
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
