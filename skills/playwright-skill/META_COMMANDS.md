# Playwright Meta Commands Reference

Beyond testing, Playwright provides powerful meta-level commands for browser automation, monitoring, and inspection.

## Page Events (for monitoring)

- `page.on('console')` - Console messages (log, warn, error, debug)
- `page.on('pageerror')` - Uncaught exceptions
- `page.on('request')` / `page.on('response')` - Network traffic
- `page.on('requestfinished')` / `page.on('requestfailed')` - Request completion
- `page.on('dialog')` - Alerts/confirms/prompts
- `page.on('popup')` - New windows/tabs
- `page.on('websocket')` - WebSocket connections
- `page.on('worker')` - Web/Service workers
- `page.on('frameattached')` / `page.on('framedetached')` - iFrame changes
- `page.on('load')` / `page.on('domcontentloaded')` - Page lifecycle
- `page.on('close')` - Page closed

## Content Capture

- `page.screenshot()` - PNG/JPEG screenshots (full page or element)
- `page.pdf()` - Generate PDFs
- `page.content()` - Full HTML including doctype
- `page.video()` - Video recording

## Network Control

- `page.route()` - Intercept/modify/mock requests
- `page.routeFromHAR()` - Replay recorded traffic
- `page.unroute()` - Remove route handlers
- `browserContext.route()` - Context-level routing

## Script Injection

- `page.addInitScript()` - Run before page loads
- `page.exposeFunction()` - Expose Node.js functions to page
- `page.exposeBinding()` - Advanced binding with source info

## Performance & Metrics

- `page.requestGC()` - Trigger garbage collection
- CDP: `Performance.getMetrics()` - Memory, JS heap, etc.
- CDP: `Network.getResponseBody()` - Response bodies

## Chrome DevTools Protocol (CDP)

Access via:
```javascript
const cdp = await page.context().newCDPSession(page);
```

### Popular CDP Domains

- `Performance` - Metrics, profiling, memory
- `Network` - Raw network data, cookies, caching
- `Runtime` - JavaScript execution control
- `Debugger` - Breakpoints, stepping
- `DOM` - Low-level DOM manipulation
- `CSS` - Style computation, coverage
- `Animation` - Animation control
- `Emulation` - Device emulation, geolocation
- `Log` - Console messages with stack traces
- `Tracing` - Performance traces

**Full CDP reference:** https://chromedevtools.github.io/devtools-protocol/

## Browser Context Events

- `context.on('page')` - New pages created
- `context.on('backgroundpage')` - Background pages (extensions)
- `context.on('serviceworker')` - Service workers
- `context.on('request')` / `context.on('response')` - Context-wide network

## Useful Meta Methods

- `page.pause()` - Pause execution for debugging
- `page.bringToFront()` - Focus tab
- `page.emulateMedia()` - Dark mode, print, reduced motion
- `page.setExtraHTTPHeaders()` - Custom headers
- `page.setViewportSize()` - Resize viewport
- `browserContext.cookies()` - Read/write cookies
- `browserContext.storageState()` - Save/restore auth state

## Navigation & History

- `page.goto()`, `page.goBack()`, `page.goForward()`, `page.reload()`
- `page.url()` - Current page URL
- `page.title()` - Page title

## Content Inspection

- `page.content()` - Full HTML including doctype
- `page.consoleMessages()` - Recent console output (up to 200)
- `page.pageErrors()` - JavaScript errors (up to 200)

## Network Monitoring

### Events
- `page.on('request')` - Outgoing requests
- `page.on('response')` - Incoming responses
- `page.on('websocket')` - WebSocket connections
  - Sub-events: `framesent`, `framereceived`, `close`

### Methods
- `page.waitForResponse()` - Wait for specific responses (glob, RegExp, predicate)
- `page.route()` - Intercept and modify requests
- Request inspection: headers, POST data, resource type
- Response inspection: status, headers, body

### Advanced Features
- HAR file replay: Record and replay network traffic
- Network mocking: Mock API endpoints without live servers
- HTTP authentication & proxies (HTTP/HTTPS, SOCKSv5)
- Glob pattern matching for URLs

## References

- [Playwright Page API](https://playwright.dev/docs/api/class-page)
- [Playwright Events](https://playwright.dev/docs/events)
- [Network Control](https://playwright.dev/docs/network)
- [CDP Session API](https://playwright.dev/docs/api/class-cdpsession)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Getting Started with CDP](https://github.com/aslushnikov/getting-started-with-cdp)
