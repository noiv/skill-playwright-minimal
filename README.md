# Playwright Browser Daemon for Claude Code

Ever wish you could just ask Claude "what's in the console?" or "count the divs on this page" while you're debugging? This skill makes that happen.

It's a persistent browser daemon that keeps Chrome open and lets Claude send it commands. Navigate pages, execute JavaScript, inspect console logs - all without opening and closing the browser a hundred times.

## What This Does

Think of it as a helpful assistant sitting in your browser. You keep one Chrome window open, and Claude can:
- Navigate to URLs and wait for pages to load
- Run any JavaScript you want in the page context
- Grab all console logs with their source locations
- Query the DOM, check element counts, inspect styles
- Resize the viewport programmatically

It's particularly handy when you're iterating on a web app - make a change, ask Claude to reload and check the console, repeat. No context switching, no manual clicking around DevTools.

## Quick Start

Install in a regular folder (not inside `.claude/` to avoid permission issues):

```bash
# Clone to your projects folder
cd ~/Projects
git clone https://github.com/noiv/skill-playwright-minimal.git
cd skill-playwright-minimal/skills/playwright-skill

# Install dependencies
npm install

# Symlink to Claude's skills directory
ln -s ~/Projects/skill-playwright-minimal/skills/playwright-skill ~/.claude/skills/playwright-skill
```

Then in Claude Code:

> "Start the browser daemon in the background"

That's it. Chrome opens, the daemon runs in the background, and you're ready to go.

## How It Works

The daemon (`browser-daemon.js`) launches Chrome via Playwright and polls for commands using simple file-based IPC. When you ask Claude to interact with the browser, it writes a command to `.browser-command`, the daemon executes it, and writes the result to `.browser-result`.

Dead simple. No network protocols, no WebSocket complexity, just files.

Commands:
- `navigate <url>` - Go to a page
- `exec "javascript"` - Run JS in the browser
- `console` - Get all captured logs
- `status` - Check current page info
- `resize <width> <height>` - Change viewport size

The daemon automatically captures all console output (log, warn, error, debug) with source locations, so you can track down where that mysterious warning is coming from.

## Lazy Restart

Close Chrome whenever you want (to use regular Chrome for browsing). The next time you ask Claude to run a command, it detects the browser is closed, restarts it, and even restores the last URL you were on. Zero friction.

## Real Examples

Debugging layout:
> "How many divs without a class attribute are on the page?"

Claude runs: `exec "document.querySelectorAll('div:not([class])').length"`

Tracking down logs:
> "Show me the console logs"

You get:
```
LOG: App initialized
  └─ http://localhost:8080/assets/index-ABC.js:42
WARN: Deprecated API call
  └─ http://localhost:8080/assets/old-module.js:156
```

Interactive testing:
> "Navigate to localhost:8080/login, fill in username 'test', and check if the submit button is enabled"

Claude runs the navigation, fills the field, checks the button state - all in one go.

## Want More Features?

The beautiful thing: Claude Code understands the codebase extremely well. Just ask it to add capabilities.

"Add a screenshot command" - it'll implement it.
"Add network request logging" - no problem.
"Add cookie management" - done.

Playwright has hundreds of APIs (see `META_COMMANDS.md` for a comprehensive list of what's possible - events, network control, CDP access, performance metrics, and more). The daemon is intentionally minimal, but you can extend it to whatever you need.

## Why Not chrome-devtools MCP?

You might be thinking "doesn't the chrome-devtools MCP server do this?"

Yes, but it's noisy. The DevTools Protocol spits out tons of events and data you don't care about. This daemon gives you exactly what you need: execute JavaScript, read console logs, navigate. Clean, focused, fast.

Plus it's file-based, so no network setup, no ports, no conflicts.

## The Quirks

Playwright controls the viewport separately from the window. So:
- Manually resizing the browser window does nothing to `window.innerWidth/Height`
- DevTools opens as an overlay, doesn't trigger resize events
- Use the `resize` command if you need to change viewport size

This is by design - Playwright wants reproducible tests, so it locks viewport control. Once you know this, it's fine.

## Project Structure

```
skill-playwright-minimal/
├── skills/
│   └── playwright-skill/
│       ├── skill.md              # Skill manifest for Claude Code
│       ├── browser-daemon.js     # Main daemon that controls Chrome
│       ├── browser-client.js     # Client for sending commands
│       ├── META_COMMANDS.md      # Advanced Playwright capabilities reference
│       ├── package.json          # Dependencies
│       └── node_modules/         # Playwright + Chrome
└── README.md                     # This file
```

## Meta Commands Reference

`META_COMMANDS.md` contains a comprehensive reference of Playwright's capabilities beyond basic testing:
- Page events for monitoring (console, network, dialogs, workers, etc.)
- Content capture (screenshots, PDFs, HTML)
- Network control (interception, mocking, HAR replay)
- Script injection and Node.js function exposure
- Performance metrics and garbage collection
- Chrome DevTools Protocol (CDP) access for low-level control
- Browser context events and useful meta methods

It's your starting point for exploring what else you can ask Claude to add to the daemon.

Curious what else is possible? Check `META_COMMANDS.md` for a tour of Playwright's capabilities - network interception, screenshot capture, performance profiling, CDP access, and more. The foundation is here; the rest is up to you.

## Dependencies

- Node.js >= 14.0.0
- Playwright (installs Google Chrome automatically)

## License

MIT License - see LICENSE file for details.
