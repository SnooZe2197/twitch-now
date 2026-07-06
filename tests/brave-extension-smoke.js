const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const bravePath = process.env.BRAVE_PATH || [
  path.join(process.env.LOCALAPPDATA || "", "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
].find((candidate) => candidate && fs.existsSync(candidate));

if (!bravePath) {
  throw new Error("Brave executable not found. Set BRAVE_PATH to run this smoke test.");
}

const port = Number(process.env.BRAVE_DEBUG_PORT || 9335);
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "twitch-now-brave-profile-"));
const fakeToken = "smoke-token";
const verbose = process.env.SMOKE_VERBOSE === "1";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

async function waitForJson(url, timeoutMs) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      return await getJson(url);
    } catch (err) {
      lastError = err;
      await delay(100);
    }
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.sessions = new Map();
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
      this.ws.addEventListener("message", (event) => this.onMessage(event));
    });
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }

    const handlers = this.handlers.get(message.method) || [];
    handlers.forEach((handler) => handler(message.params || {}, message.sessionId));
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  send(method, params, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params: params || {} };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout for ${method}`));
        }
      }, 10000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  close() {
    this.ws.close();
  }
}

function responseBody(data) {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64");
}

function twitchResponseFor(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== "api.twitch.tv") {
    return null;
  }

  if (parsed.pathname === "/helix/users") {
    return {
      data: [{
        id: "28502093",
        login: "snooze7928",
        display_name: "Snooze7928",
        profile_image_url: "https://static-cdn.jtvnw.net/jtv_user_pictures/snooze-profile.png"
      }]
    };
  }

  if (parsed.pathname === "/helix/streams/followed" || parsed.pathname === "/helix/streams") {
    return {
      data: [{
        id: "stream-1",
        user_id: "1",
        user_login: "caedrel",
        user_name: "Caedrel",
        game_id: "21779",
        game_name: "League of Legends",
        title: "Smoke stream",
        type: "live",
        viewer_count: 12345,
        started_at: "2026-07-06T10:00:00Z",
        thumbnail_url: "https://static-cdn.jtvnw.net/previews-ttv/live_user_caedrel-{width}x{height}.jpg"
      }],
      pagination: {}
    };
  }

  if (parsed.pathname === "/helix/games/top") {
    return {
      data: [{
        id: "21779",
        name: "League of Legends",
        box_art_url: "https://static-cdn.jtvnw.net/ttv-boxart/21779-{width}x{height}.jpg"
      }],
      pagination: {}
    };
  }

  return { data: [], pagination: {} };
}

function logJson(label, value) {
  console.log(JSON.stringify({ [label]: value }, null, 2));
}

function launchBrave() {
  const args = [
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-features=BraveRewards,BraveWallet",
    `--disable-extensions-except=${rootDir}`,
    `--load-extension=${rootDir}`,
    "about:blank"
  ];

  return spawn(bravePath, args, {
    stdio: "ignore",
    windowsHide: true
  });
}

function killProcessTree(processHandle) {
  if (processHandle && !processHandle.killed) {
    spawnSync("taskkill", ["/PID", String(processHandle.pid), "/T", "/F"], { stdio: "ignore" });
  }
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result && result.result.value;
}

async function waitForTarget(client, predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const [sessionId, target] of client.sessions) {
      if (predicate(target)) {
        return { sessionId, target };
      }
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for target");
}

async function waitForExtensionRuntime(client, sessionId, timeoutMs) {
  const start = Date.now();
  let lastState = null;
  while (Date.now() - start < timeoutMs) {
    lastState = await evaluate(client, sessionId, `({
      href: location.href,
      readyState: document.readyState,
      hasChrome: typeof chrome !== "undefined",
      hasRuntime: typeof chrome !== "undefined" && !!chrome.runtime,
      hasSendMessage: typeof chrome !== "undefined" && !!chrome.runtime && !!chrome.runtime.sendMessage,
      bodyText: document.body ? document.body.innerText.slice(0, 100) : ""
    })`).catch((err) => ({ error: err.message }));

    if (lastState && lastState.hasSendMessage) {
      return lastState;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for extension runtime: ${JSON.stringify(lastState)}`);
}

async function connectClient() {
  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`, 10000);
  const client = new Cdp(version.webSocketDebuggerUrl);
  await client.open();

  client.on("Target.attachedToTarget", async (params) => {
    client.sessions.set(params.sessionId, params.targetInfo);
    try {
      await client.send("Runtime.enable", {}, params.sessionId);
      await client.send("Fetch.enable", {
        patterns: [{ urlPattern: "https://api.twitch.tv/*", requestStage: "Request" }]
      }, params.sessionId);
      await client.send("Runtime.runIfWaitingForDebugger", {}, params.sessionId).catch(() => {});
    } catch (err) {
      console.warn("Unable to initialize target", params.targetInfo.url, err.message);
    }
  });

  client.on("Fetch.requestPaused", async (params, sessionId) => {
    const body = twitchResponseFor(params.request.url);
    try {
      if (body) {
        await client.send("Fetch.fulfillRequest", {
          requestId: params.requestId,
          responseCode: 200,
          responseHeaders: [
            { name: "Content-Type", value: "application/json; charset=utf-8" },
            { name: "Access-Control-Allow-Origin", value: "*" }
          ],
          body: responseBody(body)
        }, sessionId);
      } else {
        await client.send("Fetch.continueRequest", { requestId: params.requestId }, sessionId);
      }
    } catch (err) {
      console.warn("Unable to handle request", params.request.url, err.message);
    }
  });

  await client.send("Target.setAutoAttach", {
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: true
  });
  await client.send("Target.setDiscoverTargets", { discover: true });
  return client;
}

async function getExtensionId(client) {
  await delay(1500);
  const targets = await client.send("Target.getTargets");
  logJson("serviceWorkers", {
    serviceWorkers: targets.targetInfos
      .filter((target) => target.type === "service_worker")
      .map((target) => ({ title: target.title, url: target.url }))
  });

  const serviceWorker = await waitForTarget(client, (target) => {
    return target.type === "service_worker" &&
      /^chrome-extension:\/\//.test(target.url) &&
      /\/service-worker\.js$/.test(target.url);
  }, 10000);
  logJson("serviceWorkerTarget", serviceWorker.target);
  return new URL(serviceWorker.target.url).hostname;
}

async function openDebugPage(client, extensionId) {
  const target = await client.send("Target.createTarget", {
    url: `chrome-extension://${extensionId}/common/html/debug.html`
  });
  const page = await waitForTarget(client, (candidate) => candidate.targetId === target.targetId, 10000);
  const info = await waitForExtensionRuntime(client, page.sessionId, 10000);
  return { page, info };
}

async function requestSnapshot(client, sessionId) {
  return evaluate(client, sessionId, `
    new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: "TN_RPC",
        command: "GET_SNAPSHOT",
        payload: {}
      }, (response) => {
        resolve({
          lastError: chrome.runtime.lastError && chrome.runtime.lastError.message || "",
          response
        });
      });
    })
  `);
}

async function run() {
  let brave = launchBrave();
  let client = null;

  try {
    client = await connectClient();
    const extensionId = await getExtensionId(client);
    const seed = await openDebugPage(client, extensionId);
    const seedPage = seed.page;
    const seedInfo = await evaluate(client, seedPage.sessionId, `({
      url: location.href,
      title: document.title,
      hasBody: !!document.body.innerText,
      hasChrome: typeof chrome !== "undefined",
      hasStorage: typeof chrome !== "undefined" && !!chrome.storage,
      manifestName: typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest().name : null,
      manifestVersion: typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest().manifest_version : null
    })`);
    logJson("seedInfo", seedInfo);

    await evaluate(client, seedPage.sessionId, `
      Promise.all([
        new Promise((resolve) => chrome.storage.sync.set({ oauth2_twitch: "{}" }, resolve)),
        new Promise((resolve) => chrome.storage.local.set({
          oauth2_twitch_cache: { accessToken: "${fakeToken}" },
          twitchNowDebugLog: []
        }, resolve))
      ])
    `);

    client.close();
    client = null;
    killProcessTree(brave);
    brave = null;
    await delay(1000);

    brave = launchBrave();
    client = await connectClient();
    const relaunchedExtensionId = await getExtensionId(client);
    assert.strictEqual(relaunchedExtensionId, extensionId, "extension id should stay stable across Brave relaunch");
    const inspect = await openDebugPage(client, extensionId);
    const inspectPage = inspect.page;
    const inspectInfo = inspect.info;
    logJson("inspectInfo", inspectInfo);

    const rpcResult = await requestSnapshot(client, inspectPage.sessionId);

    await delay(1500);
    const secondRpcResult = await requestSnapshot(client, inspectPage.sessionId);

    const logs = await evaluate(client, inspectPage.sessionId, `
      new Promise((resolve) => {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
          resolve([]);
          return;
        }
        chrome.storage.local.get("twitchNowDebugLog", (item) => resolve(item.twitchNowDebugLog || []));
      })
    `);

    const snapshot = secondRpcResult.response && secondRpcResult.response.snapshot || {};
    const following = snapshot.collections && snapshot.collections.following || { items: [] };
    const user = snapshot.user || {};
    const logSummary = {
      total: logs.length,
      recentEvents: logs.slice(-40).map((entry) => `${entry.source}:${entry.event}`),
      recentOffscreenReuse: logs.slice(-80).filter((entry) => entry.event === "offscreen.reuse").length
    };
    const state = {
      extensionId,
      firstRpcOk: !!(rpcResult.response && rpcResult.response.ok),
      secondRpcOk: !!(secondRpcResult.response && secondRpcResult.response.ok),
      firstRpcLastError: rpcResult.lastError,
      secondRpcLastError: secondRpcResult.lastError,
      authorized: snapshot.auth && snapshot.auth.authorized,
      authUserId: snapshot.auth && snapshot.auth.userId,
      authUserName: snapshot.auth && snapshot.auth.userName,
      userAuthenticated: user.authenticated,
      userName: user.name,
      followingLength: following.items.length,
      firstFollowing: following.items[0] && {
        id: following.items[0].id,
        user_login: following.items[0].user_login,
        user_name: following.items[0].user_name
      },
      logSummary
    };

    logJson("state", state);
    if (verbose) {
      logJson("logs", logs.slice(-80));
    }

    assert.strictEqual(state.authorized, true, "popup proxy should be authorized");
    assert.strictEqual(state.userAuthenticated, true, "user should be authenticated");
    assert.strictEqual(state.userName, "Snooze7928", "user should be restored from Twitch users response");
    assert.ok(state.followingLength > 0, "following collection should be populated");
    assert.ok(state.logSummary.recentOffscreenReuse < 10, "debug logging should not cause an offscreen reuse loop");

    client.close();
  } finally {
    if (client) client.close();
    killProcessTree(brave);
    await delay(500);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (err) {
      console.warn("Unable to remove temporary Brave profile", userDataDir, err.message);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
