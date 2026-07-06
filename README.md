# Twitch Now MV3

Twitch Now MV3 is a Manifest V3 port of [Twitch Now](https://github.com/Ndragomirov/twitch-now), the browser extension that shows followed Twitch channels, top streams, games, and notifications from the toolbar popup.

This fork keeps the legacy Backbone UI and Twitch API behavior as close as possible to the original project while updating the Chrome extension runtime for modern Chromium browsers.

## Status

- Target browser: modern Chrome and Chromium-based browsers.
- Manifest: MV3.
- Background runtime: Chrome service worker plus an offscreen document that owns the legacy application state.
- Twitch OAuth: implicit flow, currently using the original redirect page at `https://ndragomirov.github.io/twitch.html`.
- Firefox and Opera builds from the original project are not maintained in this fork.

## What Changed From Upstream

- `manifest.json` was moved to the repository root and updated to Manifest V3.
- The old persistent background page was replaced by:
  - `service-worker.js` for Chrome events, OAuth tab capture, alarms, notifications, and routing.
  - `common/html/offscreen.html` plus `common/lib/offscreen-rpc.js` for the long-lived legacy Twitch Now runtime.
- The popup no longer calls `getBackgroundPage()`. It uses `common/lib/popup-state-client.js` to talk to the offscreen runtime through RPC.
- Debug logging is available through `common/html/debug.html` while MV3 stabilization continues.
- Unit and smoke tests were added under `tests/`.

## Repository Layout

- `manifest.json` - MV3 extension manifest.
- `service-worker.js` - MV3 service worker entrypoint.
- `common/html/popup.html` - toolbar popup UI.
- `common/html/offscreen.html` - offscreen document that loads the legacy runtime.
- `common/lib/offscreen-api-bridge.js` - Chrome API bridge for offscreen execution.
- `common/lib/offscreen-rpc.js` - RPC and snapshot layer between popup, service worker, and offscreen runtime.
- `common/lib/popup-state-client.js` - popup-side Backbone-compatible proxy state.
- `tests/mv3-runtime.test.js` - fast unit/regression tests.
- `tests/brave-extension-smoke.js` - Chromium smoke test using Brave and mocked Twitch API responses.

## Requirements

- Node.js 18 or newer.
- Chrome or Brave for manual extension testing.
- Brave installed at the default Windows path for `npm run test:brave`, or set `BRAVE_PATH`.

No build step is currently required for normal development. The checked-in files are loaded directly as an unpacked extension.

## Test

Run the fast regression suite:

```powershell
npm test
```

Run the Brave smoke test:

```powershell
npm run test:brave
```

The smoke test launches Brave with a temporary profile, loads the extension unpacked, mocks Twitch API responses, restarts Brave, and verifies that the MV3 runtime restores an authenticated user and followed stream snapshot.

## Load Unpacked

1. Open `chrome://extensions` or `brave://extensions`.
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select this repository directory.
5. Open the extension popup and sign in to Twitch.

If the popup state looks wrong during development, open:

```text
chrome-extension://<extension-id>/common/html/debug.html
```

The debug log is stored locally and redacts token-like values.

## OAuth Notes

The current Twitch OAuth redirect URI is inherited from upstream:

```text
https://ndragomirov.github.io/twitch.html
```

Do not change it casually. Moving to a new redirect page should be done together with a Twitch Developer Console update and a full login/logout regression pass.

## Fork Hygiene

This repository is intentionally kept as a GitHub fork of `Ndragomirov/twitch-now`. The MV3 port is committed on top of upstream history so GitHub comparisons and attribution remain useful.

The original upstream README described Chrome, Firefox, and Opera Gulp builds. Those build paths were removed from this fork because the current focus is a modern Chrome MV3 extension.

## Attribution

This project is based on [Ndragomirov/twitch-now](https://github.com/Ndragomirov/twitch-now). Most of the product behavior, UI, localization files, and legacy Backbone model structure come from that original project and its contributors.
