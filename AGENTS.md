# AGENTS.md

Guidance for coding agents working in this repository.

## Project Scope

This fork ports Twitch Now to Manifest V3 for modern Chrome and Chromium-based browsers. Keep the scope narrow unless the user explicitly asks otherwise.

- Preserve existing Twitch API endpoints and data mappings unless a requested fix requires changing them.
- Do not reintroduce Manifest V2 APIs such as `getBackgroundPage`, `chrome.extension`, `browserAction`, or `tabs.executeScript`.
- Treat Firefox and Opera legacy build support as out of scope for this fork.
- Keep the project as a GitHub fork of `Ndragomirov/twitch-now`; avoid history rewrites after pushing unless explicitly requested.

## Runtime Architecture

The MV3 runtime is split intentionally:

- `service-worker.js` owns Chrome extension events, OAuth tab capture, alarms, notification clicks, storage events, and message routing.
- `common/html/offscreen.html` loads the legacy Backbone/Twitch runtime.
- `common/lib/offscreen-rpc.js` is the source-of-truth RPC and snapshot layer for popup state.
- `common/lib/popup-state-client.js` provides Backbone-compatible proxies for the legacy popup UI.

Do not move application state back into the popup. Popup open/close must not mutate the offscreen runtime state.

## OAuth

The current OAuth redirect URI is:

```text
https://ndragomirov.github.io/twitch.html
```

Changing it requires coordinated Twitch app configuration and manual login testing. Do not change it as part of unrelated cleanup.

## Tests

Run these before finishing runtime, auth, popup, or storage changes:

```powershell
npm test
npm run test:brave
```

Also run syntax checks for touched JavaScript files:

```powershell
node --check service-worker.js common\lib\offscreen-rpc.js common\lib\offscreen-api-bridge.js common\lib\oauth2.js common\lib\app.js common\lib\popup-state-client.js common\lib\popup.js common\lib\twitch-api.js tests\mv3-runtime.test.js tests\brave-extension-smoke.js
```

Useful static scan:

```powershell
rg -n "getBackgroundPage|chrome\.extension|browserAction|tabs\.executeScript|unsafe-eval|new Function|\beval\s*\(" common/html common/lib common/dist manifest.json service-worker.js tests package.json
```

`npm run test:brave` requires Brave. Set `BRAVE_PATH` if Brave is not installed at the default Windows path.

## Debugging

Use `common/html/debug.html` for extension debug logs. The logger stores entries in `chrome.storage.local` under `twitchNowDebugLog` and redacts token-like strings.

Important past regression: forwarding `twitchNowDebugLog` storage changes back to the offscreen runtime caused a feedback loop. Keep debug-log storage changes ignored in `service-worker.js`.

Important past regression: `offscreen-api-bridge.js` must pass the native `sendResponse` callback through to bridged runtime listeners. Otherwise `GET_SNAPSHOT` fails with `The message port closed before a response was received.`

## Git Workflow

The current working branch should normally be `master`, tracking `origin/master`.

Local safety references from the initial migration may exist:

- `main`
- `safety/local-mv3-root`
- `safety-local-mv3-root-20260706`

Do not delete them unless the user asks.

Before committing:

```powershell
git status --short --branch
npm test
```

For user-facing GitHub work, prefer preserving the fork relationship and upstream history. `upstream` should point to:

```text
https://github.com/Ndragomirov/twitch-now.git
```

`origin` should point to:

```text
https://github.com/SnooZe2197/twitch-now.git
```
