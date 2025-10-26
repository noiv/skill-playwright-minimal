#!/usr/bin/env node
/**
 * Persistent browser daemon
 * - Keeps one browser window open
 * - Executes JS snippets sent to it
 * - Collects and returns console logs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COMMAND_FILE = path.join(__dirname, '.browser-command');
const RESULT_FILE = path.join(__dirname, '.browser-result');
const READY_FILE = path.join(__dirname, '.browser-ready');

let browser, context, page;
let consoleLogs = [];
let isRestarting = false;
let lastURL = 'about:blank';

async function startBrowser() {
  console.log('Starting browser...');

  // Launch Chrome (not Chromium) to get H.264 codec support
  browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--start-maximized']
  });

  // Create context without viewport initially
  context = await browser.newContext({
    viewport: null
  });

  page = await context.newPage();

  // Get actual screen dimensions via JavaScript
  const screenSize = await page.evaluate(() => ({
    width: window.screen.availWidth,
    height: window.screen.availHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  }));

  console.log('Screen available:', screenSize.width, 'x', screenSize.height);
  console.log('Window inner:', screenSize.innerWidth, 'x', screenSize.innerHeight);

  // Set viewport to match available screen size (full screen minus menubar)
  await page.setViewportSize({
    width: screenSize.width,
    height: screenSize.height
  });

  console.log('Viewport set to screen size');
  console.log('');

  setupPageListeners();
}

async function ensureBrowserReady() {
  let needsRestart = false;

  try {
    // Check if browser is disconnected or page is closed
    needsRestart = !browser || !browser.isConnected();

    if (!needsRestart && page) {
      // Try to check if page is still valid by calling a method
      try {
        await page.title();
      } catch (err) {
        // If page.title() throws, page is closed/invalid
        needsRestart = true;
      }
    } else {
      needsRestart = true;
    }
  } catch (err) {
    // Any error means we need to restart
    needsRestart = true;
  }

  if (needsRestart) {
    console.log('Browser/page closed, restarting...');
    isRestarting = true;
    try {
      if (browser && browser.isConnected()) {
        await browser.close().catch(() => {});
      }
      await startBrowser();

      // Restore last URL if not about:blank
      if (lastURL && lastURL !== 'about:blank') {
        console.log(`Restoring last URL: ${lastURL}`);
        await page.goto(lastURL, { waitUntil: 'networkidle', timeout: 30000 }).catch(err => {
          console.log(`Failed to restore URL: ${err.message}`);
        });
      }
    } catch (err) {
      console.error('Failed to restart browser:', err);
      throw err;
    } finally {
      isRestarting = false;
    }
  }
}

function setupPageListeners() {
  // Collect console logs
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleLogs.push(log);

    const prefix = {
      'log': 'LOG',
      'info': 'INFO',
      'warn': 'WARN',
      'error': 'ERROR',
      'debug': 'DEBUG'
    }[log.type] || 'MSG';

    console.log(`${prefix} [${log.type.toUpperCase()}] ${log.text}`);
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    consoleLogs.push({ type: 'pageerror', text: error.message, stack: error.stack });
  });
}

async function startDaemon() {
  await startBrowser();

  // Signal ready
  fs.writeFileSync(READY_FILE, 'ready');

  // Watch for commands
  console.log('Listening for commands...');
  console.log('');

  watchForCommands();

  // Cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    if (browser && browser.isConnected()) {
      await browser.close();
    }
    cleanup();
    process.exit(0);
  });
}

function watchForCommands() {
  setInterval(async () => {
    if (fs.existsSync(COMMAND_FILE)) {
      const commandData = fs.readFileSync(COMMAND_FILE, 'utf8');
      fs.unlinkSync(COMMAND_FILE);

      try {
        const command = JSON.parse(commandData);
        await executeCommand(command);
      } catch (err) {
        // Only catch JSON parse errors here, executeCommand handles its own errors
        console.error('Command processing error:', err.message);
        writeResult({ error: err.message });
      }
    }
  }, 100); // Check every 100ms
}

async function executeCommand(command) {
  try {
    await executeCommandInner(command);
  } catch (err) {
    // If command failed due to closed browser/page, restart and retry once
    if (err.message.includes('closed') || err.message.includes('disconnected')) {
      console.log('Command failed, restarting browser...');
      try {
        await ensureBrowserReady();
        await executeCommandInner(command);
      } catch (retryErr) {
        writeResult({ error: retryErr.message });
      }
    } else {
      writeResult({ error: err.message });
    }
  }
}

async function executeCommandInner(command) {
  const { action, data } = command;

  switch (action) {
    case 'navigate':
      await page.goto(data.url, { waitUntil: 'networkidle', timeout: 30000 });
      lastURL = page.url(); // Remember this URL
      writeResult({
        success: true,
        url: page.url(),
        title: await page.title()
      });
      break;

    case 'exec':
      const result = await page.evaluate(data.code);
      writeResult({
        success: true,
        result: result
      });
      break;

    case 'console':
      writeResult({
        success: true,
        logs: consoleLogs
      });
      break;

    case 'console-clear':
      consoleLogs = [];
      writeResult({ success: true });
      break;

    case 'status':
      writeResult({
        success: true,
        url: page.url(),
        title: await page.title(),
        consoleLogsCount: consoleLogs.length
      });
      break;

    case 'resize':
      await page.setViewportSize({
        width: data.width,
        height: data.height
      });
      writeResult({
        success: true,
        width: data.width,
        height: data.height
      });
      break;

    default:
      writeResult({ error: 'Unknown command: ' + action });
  }
}

function writeResult(data) {
  fs.writeFileSync(RESULT_FILE, JSON.stringify(data, null, 2));
}

function cleanup() {
  [COMMAND_FILE, RESULT_FILE, READY_FILE].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

// Clean up old files on start
cleanup();

// Start the daemon
startDaemon().catch(err => {
  console.error('Fatal error:', err);
  cleanup();
  process.exit(1);
});
