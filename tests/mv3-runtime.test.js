const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");

function createEvents() {
  return {
    on(name, callback) {
      this.__events = this.__events || {};
      name.split(/\s+/).forEach((eventName) => {
        this.__events[eventName] = this.__events[eventName] || [];
        this.__events[eventName].push(callback);
      });
      return this;
    },
    once(name, callback) {
      const self = this;
      function onceCallback() {
        self.off(name, onceCallback);
        callback.apply(self, arguments);
      }
      return this.on(name, onceCallback);
    },
    off(name, callback) {
      this.__events = this.__events || {};
      if (!this.__events[name]) return this;
      this.__events[name] = this.__events[name].filter((fn) => fn !== callback);
      return this;
    },
    trigger(name) {
      this.__events = this.__events || {};
      const args = Array.prototype.slice.call(arguments, 1);
      (this.__events[name] || []).slice().forEach((callback) => callback.apply(this, args));
      return this;
    }
  };
}

function extend(protoProps) {
  const Parent = this;
  class Child extends Parent {}
  Object.assign(Child.prototype, protoProps || {});
  Child.extend = extend;
  return Child;
}

function createBackbone() {
  class Model {
    constructor(attrs = {}, opts = {}) {
      Object.assign(this, createEvents());
      this.attributes = {};
      this.idAttribute = this.idAttribute || "id";
      this.set(attrs, { silent: true });
      if (this.initialize) this.initialize(attrs, opts);
    }
    get(key) {
      return this.attributes[key];
    }
    set(key, value, options = {}) {
      if (typeof key === "object") {
        options = value || {};
        Object.assign(this.attributes, key);
      } else {
        this.attributes[key] = value;
      }
      this.id = this.attributes[this.idAttribute];
      if (!options.silent) this.trigger("change", this);
      return this;
    }
    toJSON() {
      return Object.assign({}, this.attributes);
    }
  }
  Model.extend = extend;

  class Collection {
    constructor(models = [], opts = {}) {
      Object.assign(this, createEvents());
      this.models = [];
      this.model = this.model || Model;
      if (this.initialize) this.initialize(models, opts);
      this.reset(models, { silent: true });
    }
    _prepareModel(attrs, options) {
      return attrs instanceof Model ? attrs : new this.model(attrs, options);
    }
    reset(models = [], options = {}) {
      this.models = models.map((attrs) => this._prepareModel(attrs, {}));
      this.length = this.models.length;
      if (!options.silent) this.trigger("reset", this);
      return this;
    }
    set(models = [], options = {}) {
      if (!Array.isArray(models)) models = [models];
      return this.reset(models, options);
    }
    get(id) {
      return this.models.find((model) => model.id === id);
    }
    findWhere(attrs) {
      return this.models.find((model) => Object.keys(attrs).every((key) => model.get(key) === attrs[key]));
    }
    toJSON() {
      return this.models.map((model) => model.toJSON());
    }
    forEach(fn, ctx) {
      return this.models.forEach(fn, ctx);
    }
    map(fn, ctx) {
      return this.models.map(fn, ctx);
    }
    [Symbol.iterator]() {
      return this.models[Symbol.iterator]();
    }
  }
  Collection.extend = extend;

  return { Model, Collection, Events: createEvents() };
}

function createUnderscore() {
  return {
    once(fn) {
      let called = false;
      let value;
      return function () {
        if (!called) {
          called = true;
          value = fn.apply(this, arguments);
        }
        return value;
      };
    },
    debounce(fn) {
      return function () {
        return fn.apply(this, arguments);
      };
    },
    extend(target) {
      for (let i = 1; i < arguments.length; i++) {
        Object.assign(target, arguments[i]);
      }
      return target;
    },
    clone(value) {
      return Object.assign({}, value);
    }
  };
}

function loadScript(relativePath, sandbox) {
  const source = fs.readFileSync(path.join(rootDir, relativePath), "utf8");
  vm.runInNewContext(source, sandbox, { filename: relativePath });
  return sandbox;
}

function testOffscreenBridgePreservesNativeSendResponse() {
  let nativeMessageListener = null;
  const sandbox = {
    console,
    XMLHttpRequest: function () {
      throw new Error("no xhr in bridge unit test");
    },
    chrome: {
      runtime: {
        onMessage: {
          addListener(callback) {
            nativeMessageListener = callback;
          }
        },
        sendMessage() {},
        getURL(value) {
          return `chrome-extension://test/${value}`;
        }
      },
      i18n: {
        getMessage(id) {
          return id;
        }
      },
      storage: {
        session: {}
      }
    }
  };

  loadScript("common/lib/offscreen-api-bridge.js", sandbox);

  let bridgedSender = null;
  sandbox.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    bridgedSender = sender;
    sendResponse({ ok: true, command: message.command });
    return true;
  });

  let response = null;
  const keepAlive = nativeMessageListener(
    { type: "TN_OFFSCREEN_RPC", command: "GET_SNAPSHOT" },
    { url: "chrome-extension://test/common/html/popup.html" },
    (value) => {
      response = value;
    }
  );

  assert.strictEqual(keepAlive, true);
  assert.deepStrictEqual(response, { ok: true, command: "GET_SNAPSHOT" });
  assert.strictEqual(bridgedSender.url, "chrome-extension://test/common/html/popup.html");
}

function createOffscreenSandbox(storedToken) {
  const logs = [];
  const sentMessages = [];
  const storageData = {
    session: {},
    local: {}
  };
  let followingUpdateCount = 0;
  const sandbox = {
    __TN_ENABLE_TEST_HOOKS__: true,
    console,
    setTimeout(callback) {
      return global.setTimeout(callback, 0);
    },
    clearTimeout,
    Promise,
    JSON,
    Object,
    Array,
    RegExp,
    Error,
    URL,
    document: {
      createElement() {
        return {};
      },
      documentElement: {
        appendChild(script) {
          if (script.onload) script.onload();
        }
      }
    },
    twitchNowDebugLog: {
      log(source, event, details) {
        logs.push({ source, event, details });
      }
    },
    _: createUnderscore()
  };

  sandbox.chrome = {
    runtime: {
      lastError: null,
      getURL(value) {
        return `chrome-extension://test/${value}`;
      },
      onMessage: {
        addListener(callback) {
          sandbox.__runtimeMessageListener = callback;
        }
      },
      sendMessage(message, callback) {
        sentMessages.push(message);
        if (message && message.type === "TN_AUTH_STATE") {
          callback({ ok: true, token: storedToken });
          return;
        }
        if (callback) callback({ ok: true });
      }
    },
    storage: {
      session: {
        get(key, callback) {
          callback({ [key]: storageData.session[key] });
        },
        set(value, callback) {
          Object.assign(storageData.session, value);
          if (callback) callback();
        },
        remove(key, callback) {
          delete storageData.session[key];
          if (callback) callback();
        }
      },
      local: {
        get(key, callback) {
          callback({ [key]: storageData.local[key] });
        },
        set(value, callback) {
          Object.assign(storageData.local, value);
          if (callback) callback();
        },
        remove(key, callback) {
          delete storageData.local[key];
          if (callback) callback();
        }
      }
    }
  };

  sandbox.OAuth2 = {
    _adapters: {},
    addAdapter() {
      const adapter = {
        token: "",
        ready(callback) {
          callback();
        },
        isReady() {
          return true;
        },
        getAccessToken() {
          return this.token;
        },
        set(token) {
          this.token = token && token.accessToken || "";
        }
      };
      sandbox.OAuth2._adapters.twitch = adapter;
      sandbox.twitchOauth = adapter;
      return adapter;
    }
  };

  sandbox.constants = { twitchApi: { client_id: "client" } };
  sandbox.twitchApi = Object.assign(createEvents(), {
    token: "",
    userId: "",
    userName: "",
    isAuthorized() {
      return !!this.token;
    },
    trigger(eventName, value) {
      if (eventName === "tokenchange") {
        this.token = value;
      }
      return createEvents().trigger.call(this, eventName, value);
    }
  });
  sandbox.user = Object.assign(createEvents(), {
    attrs: {},
    get(key) {
      return this.attrs[key];
    },
    set(key, value) {
      if (typeof key === "object") Object.assign(this.attrs, key);
      else this.attrs[key] = value;
    },
    toJSON() {
      return Object.assign({}, this.attrs);
    },
    populateUserInfo(callback) {
      callback(null, { data: [{ id: "28502093", display_name: "Snooze7928" }] });
    }
  });
  sandbox.settings = Object.assign(createEvents(), { toJSON: () => [] });
  sandbox.badge = { toJSON: () => ({ count: 0 }), on() {} };
  sandbox.gameLobby = { toJSON: () => ({}), on() {} };
  sandbox.following = Object.assign(createEvents(), {
    length: 0,
    updating: false,
    suppressNextNotification: false,
    toJSON() {
      return this.items || [];
    },
    reset(items) {
      this.items = items || [];
      this.length = this.items.length;
    },
    defaultQuery() {
      return { first: 100 };
    },
    update(query, opts, callback) {
      followingUpdateCount += 1;
      this.items = [{ _id: "stream-1", user_id: "1", user_login: "caedrel" }];
      this.length = this.items.length;
      callback(null);
      this.trigger("update");
    }
  });

  [
    "contributors",
    "notifications",
    "followedgames",
    "topstreams",
    "videos",
    "games",
    "search",
    "gameVideos",
    "gameStreams",
    "followedChannels"
  ].forEach((name) => {
    sandbox[name] = Object.assign(createEvents(), {
      length: 0,
      toJSON: () => []
    });
  });

  sandbox.__sentMessages = sentMessages;
  sandbox.__logs = logs;
  sandbox.__storageData = storageData;
  sandbox.__followingUpdateCount = () => followingUpdateCount;
  return sandbox;
}

function createPopupSandbox(snapshotResponse) {
  const sentMessages = [];
  const ports = [];
  const sandbox = {
    __TN_ENABLE_TEST_HOOKS__: true,
    console,
    localStorage: {},
    $: {
      extend() {
        const target = arguments[0] || {};
        for (let i = 1; i < arguments.length; i++) {
          Object.assign(target, arguments[i] || {});
        }
        return target;
      }
    },
    _: createUnderscore(),
    Backbone: createBackbone(),
    twitchNowDebugLog: { log() {} }
  };

  sandbox.chrome = {
    runtime: {
      lastError: null,
      connect() {
        const port = {
          onMessage: {
            addListener(callback) {
              port.__listener = callback;
            }
          }
        };
        ports.push(port);
        return port;
      },
      sendMessage(message, callback) {
        sentMessages.push(message);
        if (message.command === "GET_SNAPSHOT") {
          callback(snapshotResponse || { ok: true, snapshot: { auth: {}, collections: {} } });
          return;
        }
        callback({ ok: true });
      }
    }
  };

  sandbox.__sentMessages = sentMessages;
  sandbox.__ports = ports;
  return sandbox;
}

function createOAuthSandbox(syncValue, localValue) {
  const sandbox = {
    console,
    localStorage: {},
    twitchNowDebugLog: { log() {} },
    EventEmitter: function () {
      return createEvents();
    },
    chrome: {
      storage: {
        sync: {
          get(key, callback) {
            callback({ [key]: syncValue });
          },
          set(value, callback) {
            if (callback) callback();
          }
        },
        local: {
          get(key, callback) {
            callback({ [key]: localValue });
          }
        },
        onChanged: {
          addListener() {}
        }
      },
      runtime: {
        onMessage: {
          addListener() {}
        },
        sendMessage(message, callback) {
          callback({ ok: true, token: {} });
        }
      }
    }
  };

  loadScript("common/lib/oauth2.js", sandbox);
  return sandbox;
}

function createOAuthAdapter(sandbox) {
  return sandbox.OAuth2.addAdapter({
    id: "twitch",
    codeflow: {
      method: "POST",
      url: "https://id.twitch.tv/oauth2/token"
    },
    opts: {
      api: "https://id.twitch.tv/oauth2/authorize",
      client_id: "client",
      client_secret: "",
      force_verify: "true",
      redirect_uri: "https://ndragomirov.github.io/twitch.html",
      response_type: "token",
      scope: "user:read:follows",
      state: "state"
    }
  });
}

function testOAuthEmptySyncFallsBackToLocalToken() {
  const sandbox = createOAuthSandbox("{}", { accessToken: "local-token" });
  const adapter = createOAuthAdapter(sandbox);

  assert.strictEqual(adapter.getAccessToken(), "local-token");
  assert.strictEqual(adapter.isReady(), true);
}

function testOAuthEmptyAccessTokenIsNotAuthorized() {
  const sandbox = createOAuthSandbox(JSON.stringify({ accessToken: "" }), null);
  const adapter = createOAuthAdapter(sandbox);

  assert.strictEqual(adapter.hasAccessToken(), false);
  assert.strictEqual(adapter.getAccessToken(), "");
}

async function testOffscreenSnapshotRehydratesAuthAndFollowing() {
  const token = { accessToken: "valid-token" };
  const sandbox = createOffscreenSandbox(token);
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: true });
  const snapshot = sandbox.__twitchNowOffscreenRpcTest.safeSnapshot();

  assert.strictEqual(sandbox.twitchApi.token, "valid-token");
  assert.strictEqual(snapshot.auth.authorized, true);
  assert.strictEqual(snapshot.auth.userId, "28502093");
  assert.strictEqual(snapshot.auth.userName, "Snooze7928");
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(sandbox.following.suppressNextNotification, true);
}

async function testGetSnapshotUsesLiveStateWithoutRefresh() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  sandbox.following.reset([{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]);
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: false });
  const snapshot = sandbox.__twitchNowOffscreenRpcTest.safeSnapshot();

  assert.strictEqual(snapshot.auth.authorized, true);
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(sandbox.__followingUpdateCount(), 0);
}

async function testSnapshotCacheRestoresColdOffscreenBeforeRefresh() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  sandbox.contributors = Object.assign(createEvents(), {
    length: 1,
    toJSON: () => [{ login: "static-contributor" }]
  });
  sandbox.__storageData.session.tn_last_snapshot = {
    auth: { authorized: true, userId: "28502093", userName: "Snooze7928" },
    user: { authenticated: true, name: "Snooze7928" },
    badge: { count: 1 },
    gameLobby: {},
    collections: {
      following: {
        items: [{ _id: "stream-1", user_id: "1", user_login: "caedrel" }],
        pagination: false,
        length: 1
      }
    }
  };
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  const restored = await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: false });
  const snapshot = sandbox.__twitchNowOffscreenRpcTest.safeSnapshot();

  assert.strictEqual(restored, true);
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(snapshot.user.name, "Snooze7928");
  assert.strictEqual(sandbox.__followingUpdateCount(), 0);
}

async function testRefreshSnapshotUsesCacheBeforeNetwork() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  sandbox.__storageData.session.tn_last_snapshot = {
    auth: { authorized: true, userId: "28502093", userName: "Snooze7928" },
    user: { authenticated: true, name: "Snooze7928" },
    badge: { count: 1 },
    gameLobby: {},
    collections: {
      following: {
        items: [{ _id: "stream-1", user_id: "1", user_login: "caedrel" }],
        pagination: false,
        length: 1
      }
    }
  };
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  const restored = await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: true });
  const snapshot = sandbox.__twitchNowOffscreenRpcTest.safeSnapshot();

  assert.strictEqual(restored, true);
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(sandbox.__followingUpdateCount(), 0);
}

function testAppStartupTokenPathRefreshesFollowingLikeUpstream() {
  const source = fs.readFileSync(path.join(rootDir, "common/lib/app.js"), "utf8");
  assert.match(source, /twitchOauth\.hasAccessToken\(\)[\s\S]*following\.suppressNextNotification = true;[\s\S]*following\.update\(\);/);
}

function testOffscreenReadyWaitsForPreparedSnapshot() {
  const source = fs.readFileSync(path.join(rootDir, "common/lib/offscreen-rpc.js"), "utf8");
  assert.match(source, /ensureLegacyRuntime\(\)[\s\S]*prepareSnapshotState\(\{ refreshIfEmpty: true \}\)[\s\S]*emitSnapshot\("ready"\)/);
  assert.doesNotMatch(source, /emitSnapshot\("runtime-ready"\)/);
  assert.doesNotMatch(source, /setTimeout\(function \(\) \{\s*emitSnapshot\("ready"\)/);
}

async function testCollectionUpdateSnapshotCanBeSavedAndRestored() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  sandbox.following.reset([{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]);
  await sandbox.__twitchNowOffscreenRpcTest.saveSnapshotCache("test", true);
  sandbox.following.reset([]);

  const restored = await sandbox.__twitchNowOffscreenRpcTest.restoreSnapshotCacheIfCold();

  assert.strictEqual(restored, true);
  assert.strictEqual(sandbox.following.length, 1);
  assert.strictEqual(sandbox.following.toJSON()[0].user_login, "caedrel");
}

async function testCollectionUpdatePersistsSnapshotBeforeRpcCompletes() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  await new Promise((resolve, reject) => {
    sandbox.__twitchNowOffscreenRpcTest.updateCollection({
      name: "following",
      query: {},
      opts: { reset: true },
      state: {}
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const cached = sandbox.__storageData.session.tn_last_snapshot;
  assert.strictEqual(cached.collections.following.items.length, 1);
  assert.strictEqual(cached.collections.following.items[0].user_login, "caedrel");
}

async function testDirectFollowingUpdatePersistsSnapshotForColdReopen() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  await new Promise((resolve, reject) => {
    sandbox.following.update({}, { reset: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const cached = sandbox.__storageData.session.tn_last_snapshot;
  const coldSandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  coldSandbox.__storageData.session.tn_last_snapshot = cached;
  loadScript("common/lib/offscreen-rpc.js", coldSandbox);

  const restored = await coldSandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: false });
  const snapshot = coldSandbox.__twitchNowOffscreenRpcTest.safeSnapshot();

  assert.strictEqual(restored, true);
  assert.strictEqual(snapshot.auth.authorized, true);
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(snapshot.collections.following.items[0].user_login, "caedrel");
  assert.strictEqual(coldSandbox.__followingUpdateCount(), 0);
}

async function testPopupCloseThenReopenPreservesLiveFollowingState() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  sandbox.following.reset([{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]);
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: false });
  sandbox.__twitchNowOffscreenRpcTest.dispatchEvent({ event: "popup-close" }, (err) => {
    assert.strictEqual(err, null);
  });
  await sandbox.__twitchNowOffscreenRpcTest.prepareSnapshotState({ refreshIfEmpty: false });

  const snapshot = sandbox.__twitchNowOffscreenRpcTest.safeSnapshot();
  assert.strictEqual(snapshot.auth.authorized, true);
  assert.strictEqual(snapshot.collections.following.items.length, 1);
  assert.strictEqual(snapshot.collections.following.items[0].user_login, "caedrel");
  assert.strictEqual(sandbox.__followingUpdateCount(), 0);
}

function testPopupCloseDoesNotMutateBackgroundCollections() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  sandbox.following.reset([{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]);
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  sandbox.__twitchNowOffscreenRpcTest.dispatchEvent({ event: "popup-close" }, (err) => {
    assert.strictEqual(err, null);
  });

  assert.strictEqual(sandbox.following.length, 1);
}

function testServiceWorkerReusesOffscreenByPath() {
  const source = fs.readFileSync(path.join(rootDir, "service-worker.js"), "utf8");
  assert.match(source, /offscreen\.reuse/);
  assert.match(source, /offscreen\.recreate-build/);
  assert.ok(source.includes("documentUrl.split(/[?#]/)[0] === offscreenBaseUrl"));
  assert.match(source, /existingBuild && existingBuild !== BUILD_ID/);
}

function testServiceWorkerDoesNotForwardDebugLogStorageChanges() {
  const source = fs.readFileSync(path.join(rootDir, "service-worker.js"), "utf8");
  assert.match(source, /changedKeys\.every\(\(key\) => key === "twitchNowDebugLog"\)/);
  assert.match(source, /return;\s*\}\s*sendToOffscreen\(\{\s*type: "BRIDGE_EVENT",\s*event: "storage\.onChanged"/);
}

function testServiceWorkerRetriesEarlyOffscreenPortClose() {
  const source = fs.readFileSync(path.join(rootDir, "service-worker.js"), "utf8");
  assert.match(source, /message port closed/i);
  assert.match(source, /sendRpcToOffscreen\(command, payload, attempt \+ 1\)/);
}

function testFindModelFallsBackToAttributesWhenPopupIdDiffers() {
  const sandbox = createOffscreenSandbox({ accessToken: "valid-token" });
  let opened = false;
  const streamModel = {
    openStream() {
      opened = true;
    }
  };
  sandbox.following = {
    get() {
      return null;
    },
    findWhere(attrs) {
      if (attrs.user_id === "1") return streamModel;
      return null;
    }
  };
  loadScript("common/lib/offscreen-rpc.js", sandbox);

  sandbox.__twitchNowOffscreenRpcTest.invokeModelAction({
    collection: "following",
    id: "popup-generated-id",
    attributes: { user_id: "1", user_login: "caedrel" },
    action: "openStream",
    args: []
  }, (err) => {
    assert.strictEqual(err, null);
  });

  assert.strictEqual(opened, true);
}

function testPopupSnapshotForcesAuthenticatedFromAuthState() {
  const sandbox = createPopupSandbox({
    ok: true,
    snapshot: {
      auth: { authorized: true, userId: "28502093", userName: "Snooze7928" },
      user: { authenticated: false, name: "Snooze7928" },
      collections: {
        following: {
          items: [{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]
        }
      }
    }
  });
  loadScript("common/lib/popup-state-client.js", sandbox);

  assert.strictEqual(sandbox.__popupStateClientTest.bg.user.get("authenticated"), true);
  assert.strictEqual(sandbox.__popupStateClientTest.bg.twitchApi.isAuthorized(), true);
  assert.strictEqual(sandbox.__popupStateClientTest.bg.following.length, 1);
}

function testPopupOpenStreamWaitsForRpcCallback() {
  const sandbox = createPopupSandbox({ ok: true, snapshot: { auth: {}, collections: {} } });
  let model;
  loadScript("common/lib/popup-state-client.js", sandbox);

  sandbox.__popupStateClientTest.bg.following.applySnapshot({
    items: [{ _id: "stream-1", user_id: "1", user_login: "caedrel" }]
  });
  model = sandbox.__popupStateClientTest.bg.following.models[0];

  let callbackCalled = false;
  model.openStream(() => {
    callbackCalled = true;
  });

  const lastMessage = sandbox.__sentMessages[sandbox.__sentMessages.length - 1];
  assert.strictEqual(lastMessage.command, "MODEL_ACTION");
  assert.strictEqual(lastMessage.payload.action, "openStream");
  assert.strictEqual(lastMessage.payload.collection, "following");
  assert.strictEqual(lastMessage.payload.attributes.user_id, "1");
  assert.strictEqual(callbackCalled, true);
}

async function run() {
  const tests = [
    testOffscreenBridgePreservesNativeSendResponse,
    testOAuthEmptySyncFallsBackToLocalToken,
    testOAuthEmptyAccessTokenIsNotAuthorized,
    testOffscreenSnapshotRehydratesAuthAndFollowing,
    testGetSnapshotUsesLiveStateWithoutRefresh,
    testSnapshotCacheRestoresColdOffscreenBeforeRefresh,
    testRefreshSnapshotUsesCacheBeforeNetwork,
    testAppStartupTokenPathRefreshesFollowingLikeUpstream,
    testOffscreenReadyWaitsForPreparedSnapshot,
    testCollectionUpdateSnapshotCanBeSavedAndRestored,
    testCollectionUpdatePersistsSnapshotBeforeRpcCompletes,
    testDirectFollowingUpdatePersistsSnapshotForColdReopen,
    testPopupCloseThenReopenPreservesLiveFollowingState,
    testPopupCloseDoesNotMutateBackgroundCollections,
    testServiceWorkerReusesOffscreenByPath,
    testServiceWorkerDoesNotForwardDebugLogStorageChanges,
    testServiceWorkerRetriesEarlyOffscreenPortClose,
    testFindModelFallsBackToAttributesWhenPopupIdDiffers,
    testPopupSnapshotForcesAuthenticatedFromAuthState,
    testPopupOpenStreamWaitsForRpcCallback
  ];

  for (const test of tests) {
    await test();
    console.log(`ok - ${test.name}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
