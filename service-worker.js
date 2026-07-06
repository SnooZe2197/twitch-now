const BUILD_ID = "mv3-runtime-20260706-auth-storage";
const OFFSCREEN_PATH = "common/html/offscreen.html";
const OFFSCREEN_URL = `${OFFSCREEN_PATH}?build=${BUILD_ID}`;
const ENSURE_ALARM = "twitch-now.ensure-offscreen";
const AUTH_ALARM = "twitch-now.auth-poll";
const OFFSCREEN_REASONS = ["LOCAL_STORAGE", "BLOBS", "AUDIO_PLAYBACK"];
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";
const IMPLICIT_AUTH_STATE_KEY = "pendingTwitchImplicitAuth";

let creatingOffscreen;
let authPollInFlight = false;
let authPollTimer = null;
let completedImplicitAuthTabs = new Set();
const popupPorts = new Set();

importScripts("common/lib/constants.js", "common/lib/debug-log.js");

function debugLog(event, details) {
  self.twitchNowDebugLog.log("service-worker", event, details);
}

debugLog("boot", {
  build: BUILD_ID
});

async function offscreenContexts() {
  if (!chrome.runtime.getContexts) {
    return [];
  }

  return chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"]
  });
}

async function closeOffscreenDocument(reason) {
  const contexts = await offscreenContexts();
  if (!contexts.length || !chrome.offscreen || !chrome.offscreen.closeDocument) {
    return;
  }

  debugLog("offscreen.close", {
    reason,
    urls: contexts.map((context) => context.documentUrl)
  });
  await chrome.offscreen.closeDocument().catch((err) => {
    debugLog("offscreen.close.error", {
      reason,
      message: err && err.message || String(err)
    });
  });
}

async function ensureOffscreenDocument() {
  const offscreenBaseUrl = chrome.runtime.getURL(OFFSCREEN_PATH);
  const contexts = await offscreenContexts();
  const existingOffscreen = contexts.find((context) => {
    const documentUrl = context.documentUrl || "";
    return documentUrl.split(/[?#]/)[0] === offscreenBaseUrl;
  });

  if (existingOffscreen) {
    const existingBuild = new URL(existingOffscreen.documentUrl).searchParams.get("build");
    if (existingBuild && existingBuild !== BUILD_ID) {
      debugLog("offscreen.recreate-build", {
        build: BUILD_ID,
        existingBuild,
        url: existingOffscreen.documentUrl
      });
      await closeOffscreenDocument("build-changed");
    } else {
      debugLog("offscreen.reuse", {
        build: BUILD_ID,
        url: existingOffscreen.documentUrl
      });
      return;
    }
  }

  if (contexts.length && !existingOffscreen) {
    await closeOffscreenDocument("stale-build");
  }

  if (!creatingOffscreen) {
    debugLog("offscreen.create", {
      build: BUILD_ID,
      url: OFFSCREEN_URL
    });
    creatingOffscreen = chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: OFFSCREEN_REASONS,
      justification: "Runs the legacy Twitch Now background runtime under Manifest V3."
    }).catch((err) => {
      if (!String(err && err.message || err).includes("Only a single offscreen document")) {
        throw err;
      }
    }).finally(() => {
      creatingOffscreen = null;
    });
  }

  return creatingOffscreen;
}

function setupEnsureAlarm() {
  chrome.alarms.create(ENSURE_ALARM, { periodInMinutes: 1 });
}

function sendToOffscreen(message) {
  return ensureOffscreenDocument()
    .then(() => chrome.runtime.sendMessage(message))
    .catch((err) => {
      console.error("Unable to message Twitch Now offscreen runtime", err);
    });
}

function isRetryableOffscreenError(err) {
  const message = err && err.message || String(err || "");
  return /Receiving end does not exist|Could not establish connection|message port closed/i.test(message);
}

function sendRpcToOffscreen(command, payload, attempt = 0) {
  return ensureOffscreenDocument()
    .then(() => new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: "TN_OFFSCREEN_RPC",
        command,
        payload: payload || {}
      }, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        resolve(response);
      });
    }))
    .catch((err) => {
      debugLog("offscreen.rpc.error", {
        command,
        attempt,
        message: err && err.message || String(err)
      });

      if (attempt < 10 && isRetryableOffscreenError(err)) {
        return new Promise((resolve) => setTimeout(resolve, 100))
          .then(() => sendRpcToOffscreen(command, payload, attempt + 1));
      }
      throw err;
    });
}

function broadcastToPopups(event) {
  popupPorts.forEach((port) => {
    try {
      port.postMessage(event);
    } catch (err) {
      popupPorts.delete(port);
    }
  });
}

function normalizeCallbackResult(args) {
  if (!args || !args.length) {
    return undefined;
  }
  return args.length === 1 ? args[0] : args;
}

function formEncode(data) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&");
}

async function postTwitchForm(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
    },
    body: formEncode(data)
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw body;
  }

  return body;
}

function twitchAuthConfig() {
  return self.constants.twitchApi;
}

async function clearPendingAuth() {
  if (authPollTimer) {
    clearTimeout(authPollTimer);
    authPollTimer = null;
  }
  await chrome.alarms.clear(AUTH_ALARM);
  await chrome.storage.local.remove(["pendingTwitchAuth", IMPLICIT_AUTH_STATE_KEY]);
}

function scheduleAuthPoll(intervalSeconds) {
  const delay = Math.max(Number(intervalSeconds) || 5, 5) * 1000;

  if (authPollTimer) {
    clearTimeout(authPollTimer);
  }

  authPollTimer = setTimeout(() => {
    authPollTimer = null;
    pollTwitchAuth();
  }, delay);

  chrome.alarms.create(AUTH_ALARM, { when: Date.now() + delay });
}

async function saveOAuthToken(tokenData) {
  const storedToken = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
    scope: tokenData.scope
  };

  await chrome.storage.sync.set({
    oauth2_twitch: JSON.stringify(storedToken)
  });
  await chrome.storage.local.set({
    oauth2_twitch_cache: storedToken
  });
  debugLog("oauth.token.saved", {
    hasAccessToken: !!storedToken.accessToken,
    accessTokenLength: storedToken.accessToken ? storedToken.accessToken.length : 0,
    hasRefreshToken: !!storedToken.refreshToken,
    scope: storedToken.scope,
    tokenType: storedToken.tokenType
  });

  await validateSavedOAuthToken(storedToken.accessToken);
  await sendRpcToOffscreen("AUTH_TOKEN_SET", { token: storedToken }).then((response) => {
    debugLog("oauth.token.offscreen.response", {
      ok: !!(response && response.ok),
      error: response && response.error || ""
    });
  }).catch((err) => {
    debugLog("oauth.token.offscreen.error", {
      message: err && err.message || String(err)
    });
  });
}

async function validateSavedOAuthToken(accessToken) {
  if (!accessToken) {
    debugLog("oauth.token.validate.skipped", {
      reason: "missing access token"
    });
    return;
  }

  try {
    const auth = twitchAuthConfig();
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": auth.client_id,
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const body = await response.json().catch(() => ({}));

    debugLog("oauth.token.validate.users", {
      status: response.status,
      ok: response.ok,
      hasUser: !!(body && body.data && body.data[0]),
      userId: body && body.data && body.data[0] && body.data[0].id || "",
      displayName: body && body.data && body.data[0] && body.data[0].display_name || "",
      response: response.ok ? undefined : body
    });
  } catch (err) {
    debugLog("oauth.token.validate.error", {
      message: err && err.message || String(err)
    });
  }
}

async function clearOAuthToken() {
  debugLog("oauth.token.clear.requested");
  await clearPendingAuth();
  await chrome.storage.local.remove("oauth2_twitch_cache");
  await chrome.storage.sync.set({
    oauth2_twitch: JSON.stringify({})
  });
  await sendRpcToOffscreen("AUTH_REVOKE").catch((err) => {
    debugLog("oauth.revoke.offscreen.error", {
      message: err && err.message || String(err)
    });
  });
}

async function getOAuthTokenState() {
  const syncItem = await chrome.storage.sync.get("oauth2_twitch");
  const localItem = await chrome.storage.local.get("oauth2_twitch_cache");
  let token = localItem.oauth2_twitch_cache || null;

  if (!token && syncItem.oauth2_twitch) {
    try {
      token = JSON.parse(syncItem.oauth2_twitch);
    } catch (err) {
      token = null;
    }
  }

  debugLog("oauth.state.request", {
    hasSync: !!syncItem.oauth2_twitch,
    hasLocal: !!localItem.oauth2_twitch_cache,
    hasAccessToken: !!(token && token.accessToken)
  });

  return token || {};
}

async function startTwitchAuth() {
  debugLog("oauth.start");
  return startTwitchImplicitAuth();
}

function buildAuthorizeUrl(auth, state) {
  const params = new URLSearchParams({
    client_id: auth.client_id,
    force_verify: "true",
    redirect_uri: auth.redirect_uri,
    response_type: "token",
    scope: auth.scope,
    state
  });

  return `${auth.api}?${params.toString()}`;
}

function parseImplicitRedirect(url) {
  const parsedUrl = new URL(url);
  const hash = new URLSearchParams((parsedUrl.hash || "").replace(/^#/, ""));
  const search = new URLSearchParams(parsedUrl.search || "");
  const error = search.get("error") || hash.get("error");

  if (error) {
    throw new Error(error);
  }

  return {
    access_token: hash.get("access_token"),
    expires_in: Number(hash.get("expires_in")) || undefined,
    scope: (hash.get("scope") || "").split(/[ +]/).filter(Boolean),
    state: hash.get("state"),
    token_type: hash.get("token_type")
  };
}

async function startTwitchImplicitAuth() {
  const auth = twitchAuthConfig();
  const state = crypto.randomUUID();
  const url = buildAuthorizeUrl(auth, state);
  const tab = await chrome.tabs.create({
    url: url
  });

  await chrome.storage.local.set({
    [IMPLICIT_AUTH_STATE_KEY]: {
      state,
      tabId: tab.id,
      redirectUri: auth.redirect_uri,
      expiresAt: Date.now() + 10 * 60 * 1000
    }
  });
  debugLog("oauth.implicit.opened", {
    tabId: tab.id,
    redirectUri: auth.redirect_uri,
    urlHost: new URL(url).host,
    scope: auth.scope
  });
}

async function handleImplicitAuthRedirect(tabId, tabUrl) {
  if (completedImplicitAuthTabs.has(tabId)) {
    return false;
  }

  const stored = await chrome.storage.local.get(IMPLICIT_AUTH_STATE_KEY);
  const pending = stored[IMPLICIT_AUTH_STATE_KEY];

  if (!pending || pending.tabId !== tabId) {
    return false;
  }

  if (Date.now() > pending.expiresAt) {
    debugLog("oauth.implicit.expired", { tabId: tabId });
    await clearPendingAuth();
    return false;
  }

  if (!tabUrl || tabUrl.indexOf(pending.redirectUri) !== 0) {
    debugLog("oauth.implicit.navigation", {
      tabId: tabId,
      urlPrefix: tabUrl ? tabUrl.slice(0, 80) : ""
    });
    return false;
  }

  try {
    completedImplicitAuthTabs.add(tabId);
    debugLog("oauth.implicit.redirect", {
      tabId: tabId,
      hasHash: tabUrl.indexOf("#") !== -1,
      hasAccessToken: tabUrl.indexOf("access_token=") !== -1
    });
    const tokenData = parseImplicitRedirect(tabUrl);

    if (!tokenData.access_token || tokenData.state !== pending.state) {
      debugLog("oauth.implicit.invalid", {
        hasAccessToken: !!tokenData.access_token,
        stateMatches: tokenData.state === pending.state
      });
      throw new Error("Invalid Twitch OAuth redirect");
    }

    await saveOAuthToken(tokenData);
    await clearPendingAuth();
    await chrome.tabs.remove(tabId).catch(() => {});
    debugLog("oauth.implicit.complete", { tabId: tabId });
  } catch (err) {
    completedImplicitAuthTabs.delete(tabId);
    debugLog("oauth.implicit.error", {
      message: err && err.message || String(err)
    });
    console.error("Twitch implicit authorization failed", err);
    await clearPendingAuth();
  }

  return true;
}

async function startTwitchDeviceAuth() {
  const auth = twitchAuthConfig();
  const device = await postTwitchForm(auth.device_url, {
    client_id: auth.client_id,
    scopes: auth.scope
  });

  const interval = Math.max(Number(device.interval) || 5, 5);
  const pending = {
    clientId: auth.client_id,
    scope: auth.scope,
    tokenUrl: auth.token_url,
    deviceCode: device.device_code,
    expiresAt: Date.now() + (Number(device.expires_in) || 1800) * 1000,
    interval
  };

  await chrome.storage.local.set({ pendingTwitchAuth: pending });
  await chrome.tabs.create({ url: device.verification_uri });
  chrome.notifications.create("twitch-now-auth", {
    type: "basic",
    iconUrl: chrome.runtime.getURL("common/icons/128_1.png"),
    title: "Twitch Now login",
    message: `Code ${device.user_code}: click Activer, then Autoriser on Twitch.`
  });
  scheduleAuthPoll(interval);
}

async function pollTwitchAuth() {
  if (authPollInFlight) {
    return;
  }

  authPollInFlight = true;

  try {
    const stored = await chrome.storage.local.get("pendingTwitchAuth");
    const pending = stored.pendingTwitchAuth;

    if (!pending) {
      await chrome.alarms.clear(AUTH_ALARM);
      return;
    }

    if (Date.now() > pending.expiresAt) {
      await clearPendingAuth();
      return;
    }

    try {
      const tokenData = await postTwitchForm(pending.tokenUrl, {
        client_id: pending.clientId,
        scopes: pending.scope,
        device_code: pending.deviceCode,
        grant_type: DEVICE_GRANT_TYPE
      });

      await saveOAuthToken(tokenData);
      await clearPendingAuth();
    } catch (err) {
      const message = err && (err.message || err.error || err.status);

      if (message === "authorization_pending") {
        scheduleAuthPoll(pending.interval);
        return;
      }

      if (message === "slow_down") {
        const nextInterval = Number(pending.interval || 5) + 5;
        pending.interval = nextInterval;
        await chrome.storage.local.set({ pendingTwitchAuth: pending });
        scheduleAuthPoll(nextInterval);
        return;
      }

      console.error("Twitch device authorization failed", err);
      await clearPendingAuth();
    }
  } finally {
    authPollInFlight = false;
  }
}

function callChromeApi(api, method, args) {
  if (api === "tabs" && method === "executeScript") {
    const tabId = args[0];
    return chrome.scripting.executeScript({
      target: { tabId },
      files: ["common/content/oauth-redirect.js"]
    });
  }

  const target = api.split(".").reduce((value, key) => value && value[key], chrome);
  if (!target || typeof target[method] !== "function") {
    return Promise.reject(new Error(`Unsupported Chrome API call: ${api}.${method}`));
  }

  return new Promise((resolve, reject) => {
    try {
      target[method](...args, (...callbackArgs) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        resolve(normalizeCallbackResult(callbackArgs));
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function handleBridgeCall(message) {
  const data = await callChromeApi(message.api, message.method, message.args || []);
  return { ok: true, data };
}

chrome.runtime.onInstalled.addListener(() => {
  setupEnsureAlarm();
  closeOffscreenDocument("installed").then(() => ensureOffscreenDocument());
});

chrome.runtime.onStartup.addListener(() => {
  setupEnsureAlarm();
  closeOffscreenDocument("startup").then(() => ensureOffscreenDocument());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ENSURE_ALARM) {
    ensureOffscreenDocument();
  }

  if (alarm.name === AUTH_ALARM) {
    pollTwitchAuth();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  handleImplicitAuthRedirect(tabId, changeInfo.url || tab.url).catch((err) => {
    console.error("Unable to process Twitch OAuth redirect", err);
  });

  sendToOffscreen({
    type: "BRIDGE_EVENT",
    event: "tabs.onUpdated",
    args: [tabId, changeInfo, tab]
  });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  sendToOffscreen({
    type: "BRIDGE_EVENT",
    event: "notifications.onClicked",
    args: [notificationId]
  });
});

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  sendToOffscreen({
    type: "BRIDGE_EVENT",
    event: "notifications.onClosed",
    args: [notificationId, byUser]
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  const changedKeys = Object.keys(changes || {});
  if (namespace === "local" && changedKeys.length && changedKeys.every((key) => key === "twitchNowDebugLog")) {
    return;
  }

  sendToOffscreen({
    type: "BRIDGE_EVENT",
    event: "storage.onChanged",
    args: [changes, namespace]
  });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "TN_POPUP_PORT") {
    return;
  }
  popupPorts.add(port);
  port.onDisconnect.addListener(() => {
    popupPorts.delete(port);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "BRIDGE_API_CALL") {
    handleBridgeCall(message)
      .then(sendResponse)
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message || String(err)
      }));
    return true;
  }

  if (message && message.type === "TN_RPC") {
    const command = message.command;

    if (command === "AUTH_START") {
      startTwitchAuth()
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: err && err.message || String(err) }));
      return true;
    }

    if (command === "AUTH_REVOKE") {
      clearOAuthToken()
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: err && err.message || String(err) }));
      return true;
    }

    sendRpcToOffscreen(command, message.payload || {})
      .then(sendResponse)
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message || String(err)
      }));
    return true;
  }

  if (message && message.type === "TN_STATE_EVENT") {
    broadcastToPopups(message.event);
    sendResponse({ ok: true });
    return false;
  }

  if (message && message.type === "TN_AUTH_START") {
    debugLog("message.auth.start", {
      senderUrl: sender && sender.url || ""
    });
    startTwitchAuth()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        debugLog("message.auth.start.error", {
          message: err && err.message || String(err)
        });
        console.error("Unable to start Twitch authorization", err);
        sendResponse({ ok: false, error: err && err.message || String(err) });
      });
    return true;
  }

  if (message && message.type === "TN_AUTH_REVOKE") {
    debugLog("message.auth.revoke", {
      senderUrl: sender && sender.url || ""
    });
    clearOAuthToken()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("Unable to revoke Twitch authorization", err);
        sendResponse({ ok: false, error: err && err.message || String(err) });
      });
    return true;
  }

  if (message && message.type === "TN_AUTH_STATE") {
    getOAuthTokenState()
      .then((token) => sendResponse({ ok: true, token }))
      .catch((err) => {
        debugLog("oauth.state.error", {
          message: err && err.message || String(err)
        });
        sendResponse({ ok: false, error: err && err.message || String(err) });
      });
    return true;
  }

  if (message && message.type === "OAUTH2") {
    sendToOffscreen({
      type: "BRIDGE_RUNTIME_MESSAGE",
      message,
      sender
    });
  }

  if (message && message.type === "TN_DEBUG_LOG") {
    debugLog(message.event || "external", message.details || {});
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

setupEnsureAlarm();
ensureOffscreenDocument();
