(function (root) {
  "use strict";

  var BUILD_ID = "mv3-runtime-20260706-auth-storage";
  var SNAPSHOT_CACHE_KEY = "tn_last_snapshot";
  var COLLECTION_NAMES = [
    "settings",
    "contributors",
    "notifications",
    "followedgames",
    "topstreams",
    "following",
    "videos",
    "games",
    "search",
    "gameVideos",
    "gameStreams",
    "followedChannels"
  ];
  var runtimeReadyPromise = null;
  var stateEventsBound = false;

  function debugLog(event, details) {
    if (root.twitchNowDebugLog) {
      root.twitchNowDebugLog.log("offscreen-rpc", event, details);
    }
  }

  var lastAuthKey = "";

  function jsonClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getTwitchOauth() {
    return root.twitchOauth ||
      root.OAuth2 && root.OAuth2._adapters && root.OAuth2._adapters.twitch ||
      null;
  }

  function scriptUrl(path) {
    return chrome.runtime.getURL(path) + "?build=" + encodeURIComponent(BUILD_ID);
  }

  function loadScript(path) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = scriptUrl(path);
      script.onload = function () {
        debugLog("runtime.script.loaded", { path: path });
        resolve();
      };
      script.onerror = function () {
        reject(new Error("Unable to load " + path));
      };
      document.documentElement.appendChild(script);
    });
  }

  function ensureOauthAdapter() {
    var oauth = getTwitchOauth();
    if (!oauth && root.OAuth2 && root.constants && root.constants.twitchApi) {
      oauth = root.OAuth2.addAdapter({
        id      : "twitch",
        codeflow: {
          method: "POST",
          url   : "https://id.twitch.tv/oauth2/token"
        },
        opts    : root.constants.twitchApi
      });
      debugLog("runtime.oauth.created", {
        hasOAuth: !!oauth,
        hasSet: !!(oauth && oauth.set)
      });
    }

    if (oauth) {
      root.twitchOauth = oauth;
    }

    return oauth;
  }

  function ensureOauthBinding() {
    if (getTwitchOauth()) {
      return Promise.resolve();
    }

    return loadScript("common/lib/twitch-oauth-init.js")
      .then(function () {
        if (!getTwitchOauth()) {
          ensureOauthAdapter();
        }
        debugLog("runtime.oauth.binding", {
          hasOAuth: !!getTwitchOauth(),
          hasGlobalProperty: !!root.twitchOauth
        });
      })
      .catch(function (err) {
        ensureOauthAdapter();
        debugLog("runtime.oauth.binding.fallback", {
          message: err && err.message || String(err),
          hasOAuth: !!getTwitchOauth()
        });
      });
  }

  function ensureTwitchApi() {
    if (root.twitchApi) {
      return Promise.resolve();
    }

    if (root.TwitchApi) {
      root.twitchApi = new root.TwitchApi(root.utils.getConstants().twitchApi.client_id);
      debugLog("runtime.twitch-api.created", {
        hasApi: !!root.twitchApi
      });
      return Promise.resolve();
    }

    return loadScript("common/lib/twitch-api.js").then(function () {
      if (!root.twitchApi && root.TwitchApi) {
        root.twitchApi = new root.TwitchApi(root.utils.getConstants().twitchApi.client_id);
      }
      debugLog("runtime.twitch-api.loaded", {
        hasConstructor: !!root.TwitchApi,
        hasApi: !!root.twitchApi
      });
    });
  }

  function ensureAppRuntime() {
    if (root.settings && root.user && root.topstreams) {
      return Promise.resolve();
    }

    return loadScript("common/lib/app.js").then(function () {
      debugLog("runtime.app.loaded", {
        hasSettings: !!root.settings,
        hasUser: !!root.user,
        hasTopstreams: !!root.topstreams
      });
    });
  }

  function ensureLegacyRuntime() {
    if (getTwitchOauth() && root.twitchApi && root.settings && root.user) {
      syncAuthFromOAuth();
      return Promise.resolve();
    }

    if (runtimeReadyPromise) {
      return runtimeReadyPromise;
    }

    runtimeReadyPromise = Promise.resolve()
      .then(ensureOauthBinding)
      .then(function () {
        var oauth = ensureOauthAdapter();
        if (!oauth || !oauth.set) {
          throw new Error("oauth-unavailable");
        }
      })
      .then(ensureTwitchApi)
      .then(ensureAppRuntime)
      .then(function () {
        return waitForOAuthReady();
      })
      .then(function () {
        syncAuthFromOAuth();
        bindStateEvents();
        debugLog("runtime.ready", {
          hasOAuth: !!getTwitchOauth(),
          hasApi: !!root.twitchApi,
          hasSettings: !!root.settings,
          hasUser: !!root.user
        });
      })
      .catch(function (err) {
        runtimeReadyPromise = null;
        debugLog("runtime.error", {
          message: err && err.message || String(err)
        });
        throw err;
      });

    return runtimeReadyPromise;
  }

  function waitForOAuthReady() {
    var oauth = ensureOauthAdapter();

    if (!oauth || !oauth.ready || oauth.isReady()) {
      return Promise.resolve();
    }

    debugLog("oauth.ready.wait");
    return new Promise(function (resolve) {
      var done = _.once(function () {
        debugLog("oauth.ready.done", {
          hasAccessToken: !!(oauth.getAccessToken && oauth.getAccessToken())
        });
        resolve();
      });

      oauth.ready(done);
      setTimeout(done, 2000);
    });
  }

  function syncAuthFromOAuth() {
    var oauth = getTwitchOauth();
    var accessToken = oauth && oauth.getAccessToken && oauth.getAccessToken();

    if (!root.twitchApi || !accessToken) {
      return false;
    }

    if (root.twitchApi.token !== accessToken) {
      root.twitchApi.trigger("tokenchange", accessToken);
      debugLog("auth.sync-from-oauth", {
        hasAccessToken: true,
        tokenLength: accessToken.length
      });
    }

    return true;
  }

  function readStoredTokenState() {
    return new Promise(function (resolve) {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        resolve(null);
        return;
      }

      chrome.runtime.sendMessage({ type: "TN_AUTH_STATE" }, function (response) {
        var err = chrome.runtime.lastError;
        if (err || !response || !response.ok || !response.token || !response.token.accessToken) {
          debugLog("auth.storage-state.miss", {
            message: err && err.message || response && response.error || ""
          });
          resolve(null);
          return;
        }

        debugLog("auth.storage-state.hit", {
          hasAccessToken: true,
          accessTokenLength: response.token.accessToken.length
        });
        resolve(response.token);
      });
    });
  }

  function syncAuthFromStorage() {
    if (root.twitchApi && root.twitchApi.isAuthorized && root.twitchApi.isAuthorized()) {
      return Promise.resolve(true);
    }

    return readStoredTokenState().then(function (token) {
      var oauth = ensureOauthAdapter();

      if (!token || !oauth || !oauth.set) {
        return false;
      }

      oauth.set(token, true);
      return syncAuthFromOAuth();
    });
  }

  function populateUserForSnapshot() {
    if (!root.twitchApi || !root.user || !root.user.populateUserInfo || !root.twitchApi.isAuthorized()) {
      return Promise.resolve();
    }

    if (root.user.get && root.user.get("authenticated") && root.twitchApi.userId) {
      return Promise.resolve();
    }

    debugLog("snapshot.user.populate.start");
    return new Promise(function (resolve) {
      root.user.populateUserInfo(function (err, res) {
        var user = res && res.data && res.data[0];

        if (!err && user) {
          root.twitchApi.userId = user.id || root.twitchApi.userId;
          root.twitchApi.userName = user.display_name || root.twitchApi.userName;
          root.user.set("authenticated", true);
          root.twitchApi.trigger("userid");
        }

        debugLog("snapshot.user.populate.done", {
          error: !!err,
          hasUser: !!user,
          userId: root.twitchApi.userId || "",
          userName: root.twitchApi.userName || ""
        });
        resolve();
      });
    });
  }

  function waitForCollectionIdle(collection, timeoutMs) {
    if (!collection || !collection.updating || !collection.once) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      var done = _.once(resolve);
      collection.once("update _error error", done);
      setTimeout(done, timeoutMs || 4000);
    });
  }

  function ensureFollowingForSnapshot() {
    if (!root.following || !root.following.update || !root.twitchApi || !root.twitchApi.isAuthorized()) {
      return Promise.resolve();
    }

    if (root.following.length || root.following.updating) {
      return waitForCollectionIdle(root.following, 4000);
    }

    debugLog("snapshot.following.update.start");
    root.following.suppressNextNotification = true;
    return new Promise(function (resolve) {
      var done = _.once(function (err) {
        debugLog("snapshot.following.update.done", {
          error: !!err,
          length: root.following.length
        });
        resolve();
      });

      root.following.update(root.following.defaultQuery && root.following.defaultQuery() || {}, { reset: true }, done);
      setTimeout(done, 5000);
    });
  }

  function storageArea() {
    if (chrome.storage && chrome.storage.session && chrome.storage.session.get && chrome.storage.session.set) {
      return chrome.storage.session;
    }
    return chrome.storage && chrome.storage.local;
  }

  function storageGet(key) {
    return new Promise(function (resolve) {
      var area = storageArea();
      if (!area || !area.get) {
        resolve({});
        return;
      }
      area.get(key, function (item) {
        resolve(item || {});
      });
    });
  }

  function storageSet(value) {
    return new Promise(function (resolve) {
      var area = storageArea();
      if (!area || !area.set) {
        resolve();
        return;
      }
      area.set(value, function () {
        resolve();
      });
    });
  }

  function hasCacheableCollectionItems(cachedSnapshot) {
    var cacheableNames = [
      "notifications",
      "followedgames",
      "topstreams",
      "following",
      "videos",
      "games",
      "search",
      "gameVideos",
      "gameStreams",
      "followedChannels"
    ];
    return !!(cachedSnapshot && cachedSnapshot.collections && cacheableNames.some(function (name) {
      var collection = cachedSnapshot.collections[name];
      return collection && collection.items && collection.items.length;
    }));
  }

  function restoreCollectionState(name, cached) {
    var collection = root[name];
    if (!collection || !cached) {
      return;
    }

    ["pageQuery", "query", "channel", "game", "gameid", "langFilter", "enableLanguage", "lastErrorMessage", "pagination"].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(cached, key)) {
        collection[key] = cached[key];
      }
    });

    collection.updating = false;
    if (collection.reset && cached.items) {
      collection.reset(cached.items, { silent: true });
    }
  }

  function restoreSnapshotCacheIfCold() {
    var current = safeSnapshot();

    return storageGet(SNAPSHOT_CACHE_KEY).then(function (item) {
      var cached = item && item[SNAPSHOT_CACHE_KEY];
      var restoredNames = [];

      if (!cached || !cached.collections) {
        debugLog("snapshot.cache.miss");
        return false;
      }

      if (root.user && root.user.set && cached.user) {
        root.user.set(cached.user, { silent: true });
      }
      if (root.badge && root.badge.set && cached.badge) {
        root.badge.set(cached.badge, { silent: true });
      }
      if (root.gameLobby && root.gameLobby.set && cached.gameLobby) {
        root.gameLobby.set(cached.gameLobby, { silent: true });
      }

      Object.keys(cached.collections || {}).forEach(function (name) {
        var currentCollection = current.collections && current.collections[name];
        var cachedCollection = cached.collections[name];
        var currentItems = currentCollection && currentCollection.items || [];
        var cachedItems = cachedCollection && cachedCollection.items || [];

        if (!currentItems.length && cachedItems.length) {
          restoreCollectionState(name, cachedCollection);
          restoredNames.push(name);
        }
      });

      if (!restoredNames.length) {
        debugLog("snapshot.cache.skip", {
          reason: "current-state-not-cold"
        });
        return false;
      }

      debugLog("snapshot.cache.restore", {
        collections: restoredNames,
        followingLength: root.following ? root.following.length : 0
      });
      return true;
    });
  }

  function saveSnapshotCache(reason, force) {
    var current = safeSnapshot();
    if (!force && !hasCacheableCollectionItems(current)) {
      return Promise.resolve(false);
    }

    var value = {};
    value[SNAPSHOT_CACHE_KEY] = current;
    return storageSet(value).then(function () {
      debugLog("snapshot.cache.save", {
        reason: reason || "",
        followingLength: current.collections && current.collections.following ? current.collections.following.length : 0
      });
      return true;
    });
  }

  function refreshFollowingInBackground(reason) {
    if (!root.following || !root.following.update || root.following.updating || !root.twitchApi || !root.twitchApi.isAuthorized()) {
      return;
    }

    debugLog("snapshot.background-refresh.start", {
      reason: reason || ""
    });
    root.following.suppressNextNotification = true;
    root.following.update(root.following.defaultQuery && root.following.defaultQuery() || {}, { reset: true }, function (err) {
      debugLog("snapshot.background-refresh.done", {
        reason: reason || "",
        error: !!err,
        followingLength: root.following.length
      });
      if (!err) {
        saveSnapshotCache("background-refresh", true);
      }
      emitSnapshot("background-refresh");
    });
  }

  function prepareSnapshotState(options) {
    options = options || {};
    return waitForOAuthReady()
      .then(function () {
        if (syncAuthFromOAuth()) {
          return true;
        }
        return syncAuthFromStorage();
      })
      .then(function () {
        return populateUserForSnapshot();
      })
      .then(function () {
        return restoreSnapshotCacheIfCold();
      })
      .then(function (restored) {
        if (restored) {
          return true;
        }

        if (options.refreshIfEmpty) {
          return ensureFollowingForSnapshot().then(function () {
            return false;
          });
        }
        return false;
      });
  }

  debugLog("loaded", {
    build: BUILD_ID,
    hasOAuth2: !!root.OAuth2,
    hasTwitchOauth: !!getTwitchOauth(),
    hasTwitchApi: !!root.twitchApi
  });

  function collectionSnapshot(name) {
    var collection = root[name];
    if (!collection || !collection.toJSON) {
      return { items: [] };
    }

    return {
      items: collection.toJSON(),
      updating: !!collection.updating,
      pagination: !!collection.pagination,
      pageQuery: collection.pageQuery || null,
      lastErrorMessage: collection.lastErrorMessage || "",
      query: collection.query || null,
      channel: collection.channel || null,
      game: collection.game || null,
      gameid: collection.gameid || null,
      langFilter: collection.langFilter,
      enableLanguage: collection.enableLanguage,
      length: collection.length
    };
  }

  function snapshot() {
    var collections = {};
    COLLECTION_NAMES.forEach(function (name) {
      collections[name] = collectionSnapshot(name);
    });

    return {
      auth: {
        authorized: !!(root.twitchApi && root.twitchApi.isAuthorized()) || !!(getTwitchOauth() && getTwitchOauth().getAccessToken && getTwitchOauth().getAccessToken()),
        userId: root.twitchApi && root.twitchApi.userId || "",
        userName: root.twitchApi && root.twitchApi.userName || ""
      },
      user: root.user && root.user.toJSON ? root.user.toJSON() : {},
      badge: root.badge && root.badge.toJSON ? root.badge.toJSON() : {},
      gameLobby: root.gameLobby && root.gameLobby.toJSON ? root.gameLobby.toJSON() : {},
      collections: collections
    };
  }

  function safeSnapshot() {
    try {
      return jsonClone(snapshot());
    } catch (err) {
      debugLog("snapshot.error", {
        message: err && err.message || String(err)
      });
      return {
        auth: {
          authorized: !!(root.twitchApi && root.twitchApi.isAuthorized()) || !!(getTwitchOauth() && getTwitchOauth().getAccessToken && getTwitchOauth().getAccessToken()),
          userId: root.twitchApi && root.twitchApi.userId || "",
          userName: root.twitchApi && root.twitchApi.userName || ""
        },
        user: {},
        badge: {},
        gameLobby: {},
        collections: {}
      };
    }
  }

  function emitSnapshot(reason) {
    var currentSnapshot = safeSnapshot();
    var authKey = JSON.stringify(currentSnapshot.auth || {});

    chrome.runtime.sendMessage({
      type: "TN_STATE_EVENT",
      event: {
        type: "SNAPSHOT",
        reason: reason || "change",
        snapshot: currentSnapshot
      }
    });

    if (authKey !== lastAuthKey || /auth|ready/i.test(reason || "")) {
      lastAuthKey = authKey;
      chrome.runtime.sendMessage({
        type: "TN_STATE_EVENT",
        event: {
          type: "AUTH_STATE",
          reason: reason || "change",
          auth: currentSnapshot.auth
        }
      });
    }
  }

  var debouncedEmit = _.debounce(function () {
    emitSnapshot("debounced-change");
  }, 100);

  var debouncedFollowingCacheSave = _.debounce(function () {
    saveSnapshotCache("following-state-event", true);
  }, 250);

  function bindStateEvents() {
    if (stateEventsBound || !root.twitchApi || !root.settings) {
      return;
    }

    if (root.twitchApi && root.twitchApi.on) {
      root.twitchApi.on("authorize revoke userid", debouncedEmit);
    }

    ["user", "badge", "gameLobby"].forEach(function (name) {
      if (root[name] && root[name].on) {
        root[name].on("change", debouncedEmit);
      }
    });

    COLLECTION_NAMES.forEach(function (name) {
      var collection = root[name];
      if (collection && collection.on) {
        collection.on("reset update add remove change sort addarray _error update-status", debouncedEmit);
        if (name === "following") {
          collection.on("reset update add remove addarray", debouncedFollowingCacheSave);
        }
      }
    });
    stateEventsBound = true;
  }

  function findModel(collectionName, payload) {
    var target = collectionName && root[collectionName];
    var id = payload && payload.id;
    var attributes = payload && payload.attributes || {};
    var found = null;

    if (!target) {
      return null;
    }

    if (target.get && id !== undefined && id !== null) {
      found = target.get(id) || target.findWhere && target.findWhere({ _id: id });
      if (found) {
        return found;
      }
    }

    if (target.findWhere && attributes && Object.keys(attributes).length) {
      return target.findWhere({ id: attributes.id }) ||
        target.findWhere({ _id: attributes._id }) ||
        target.findWhere({ user_id: attributes.user_id }) ||
        target.findWhere({ user_login: attributes.user_login }) ||
        target.findWhere({ to_id: attributes.to_id });
    }

    return target;
  }

  function invokeModelAction(payload, callback) {
    var target = payload.modelName ? root[payload.modelName] : findModel(payload.collection, payload);
    var args = payload.args || [];

    if (!target || typeof target[payload.action] !== "function") {
      debugLog("model-action.unavailable", {
        collection: payload.collection || "",
        modelName: payload.modelName || "",
        action: payload.action || "",
        id: payload.id || "",
        hasAttributes: !!(payload.attributes && Object.keys(payload.attributes).length)
      });
      callback({ error: "unknown-action" });
      return;
    }

    try {
      if (/^(follow|unfollow)$/.test(payload.action)) {
        target[payload.action].apply(target, args.concat(function (err) {
          callback(err ? { error: err.message || String(err) } : null);
          emitSnapshot("model-action");
        }));
        return;
      }

      target[payload.action].apply(target, args);
      callback(null);
      emitSnapshot("model-action");
    } catch (err) {
      callback({ error: err.message || String(err) });
    }
  }

  function updateCollection(payload, callback) {
    var collection = root[payload.name];
    if (!collection || typeof collection.update !== "function") {
      callback({ error: "unknown-collection" });
      return;
    }

    ["query", "channel", "game", "gameid", "langFilter", "enableLanguage"].forEach(function (key) {
      if (payload.state && Object.prototype.hasOwnProperty.call(payload.state, key)) {
        collection[key] = payload.state[key];
      }
    });

    collection.update(payload.query || {}, payload.opts || { reset: true }, function (err) {
      if (err) {
        callback({ error: err.message || String(err), status: err.status });
        emitSnapshot("collection-update");
        return;
      }

      saveSnapshotCache("collection-update:" + payload.name, true).then(function () {
        callback(null);
        emitSnapshot("collection-update");
      });
    });
  }

  function loadNext(payload, callback) {
    var collection = root[payload.name];
    if (!collection || typeof collection.loadNext !== "function") {
      callback({ error: "unknown-collection" });
      return;
    }
    collection.loadNext();
    callback(null);
  }

  function setSettings(payload, callback) {
    if (!root.settings || !root.settings.set) {
      callback({ error: "settings-unavailable" });
      return;
    }
    root.settings.set(payload.settings || [], { add: false, remove: false });
    if (root.settings.saveToStorage) {
      root.settings.saveToStorage();
    }
    callback(null);
    emitSnapshot("settings-set");
  }

  function applyToken(payload, callback) {
    var oauth = ensureOauthAdapter();
    debugLog("auth-token.apply.start", {
      hasOAuth: !!oauth,
      hasSet: !!(oauth && oauth.set),
      hasApi: !!root.twitchApi,
      hasAccessToken: !!(payload && payload.token && payload.token.accessToken)
    });

    if (!oauth || !oauth.set) {
      debugLog("auth-token.apply.unavailable");
      callback({ error: "oauth-unavailable" });
      return;
    }

    try {
      root.twitchOauth = oauth;
      oauth.set(payload.token || {}, true);
      debugLog("auth-token.applied", {
        hasAccessToken: !!(payload.token && payload.token.accessToken),
        apiAuthorized: !!(root.twitchApi && root.twitchApi.isAuthorized && root.twitchApi.isAuthorized()),
        apiTokenLength: root.twitchApi && root.twitchApi.token ? root.twitchApi.token.length : 0
      });
      callback(null);
    } catch (err) {
      debugLog("auth-token.apply.error", {
        message: err && err.message || String(err)
      });
      callback({ error: err && err.message || String(err) });
      return;
    }

    setTimeout(function () {
      emitSnapshot("auth-token-set");
    }, 250);
  }

  function revoke(callback) {
    var oauth = ensureOauthAdapter();
    if (oauth && oauth.clearAccessToken) {
      oauth.clearAccessToken();
    }
    callback(null);
    emitSnapshot("auth-revoke");
  }

  function dispatchEvent(payload, callback) {
    if (payload.event === "popup-close") {
      debugLog("dispatch-event.ignored", {
        event: payload.event
      });
      callback(null);
      return;
    }

    if (!root.bgApp || !root.bgApp.dispatcher || !root.bgApp.dispatcher.trigger) {
      callback({ error: "dispatcher-unavailable" });
      return;
    }

    root.bgApp.dispatcher.trigger.apply(root.bgApp.dispatcher, [payload.event].concat(payload.args || []));
    callback(null);
    emitSnapshot("dispatch-event");
  }

  function handleRpc(message, sendResponse) {
    var command = message.command;
    var payload = message.payload || {};

    debugLog("rpc.request", { command: command });

    function done(err, data) {
      var response = {
        ok: !err,
        error: err && (err.error || err.message || String(err)),
        data: data || null
      };

      if (command === "GET_SNAPSHOT") {
        response.snapshot = safeSnapshot();
      }

      try {
        sendResponse(response);
      } catch (sendErr) {
        debugLog("rpc.response.error", {
          command: command,
          message: sendErr && sendErr.message || String(sendErr)
        });
      }
    }

    if (command === "GET_SNAPSHOT") {
      ensureLegacyRuntime()
        .then(function () { return prepareSnapshotState({ refreshIfEmpty: true }); })
        .then(function (restored) {
          done(null);
          if (restored) {
            setTimeout(function () {
              refreshFollowingInBackground("cache-restored");
            }, 0);
          } else if (root.twitchApi && root.twitchApi.isAuthorized && root.twitchApi.isAuthorized() && root.following && !root.following.length) {
            setTimeout(function () {
              refreshFollowingInBackground("empty-snapshot");
            }, 0);
          }
        })
        .catch(function () { done(null); });
      return;
    }

    if (command === "PING") {
      return done(null, {
        build: BUILD_ID,
        hasOAuth2: !!root.OAuth2,
        hasTwitchOauth: !!getTwitchOauth(),
        hasTwitchApi: !!root.twitchApi,
        hasSettings: !!root.settings
      });
    }

    ensureLegacyRuntime()
      .then(function () {
        if (command === "AUTH_TOKEN_SET") return applyToken(payload, done);
        if (command === "AUTH_REVOKE") return revoke(done);
        if (command === "COLLECTION_UPDATE") return updateCollection(payload, done);
        if (command === "COLLECTION_LOAD_NEXT") return loadNext(payload, done);
        if (command === "MODEL_ACTION") return invokeModelAction(payload, done);
        if (command === "SETTINGS_SET") return setSettings(payload, done);
        if (command === "DISPATCH_EVENT") return dispatchEvent(payload, done);
        if (command === "PLAY_SOUND" && root.bgApp && root.bgApp.playSound) {
          root.bgApp.playSound.apply(root.bgApp, payload.args || []);
          return done(null);
        }

        done({ error: "unknown-command" });
      })
      .catch(function (err) {
        done({ error: err && err.message || String(err) });
      });
  }

  if (root.__TN_ENABLE_TEST_HOOKS__) {
    root.__twitchNowOffscreenRpcTest = {
      safeSnapshot: safeSnapshot,
      prepareSnapshotState: prepareSnapshotState,
      syncAuthFromOAuth: syncAuthFromOAuth,
      syncAuthFromStorage: syncAuthFromStorage,
      populateUserForSnapshot: populateUserForSnapshot,
      ensureFollowingForSnapshot: ensureFollowingForSnapshot,
      restoreSnapshotCacheIfCold: restoreSnapshotCacheIfCold,
      saveSnapshotCache: saveSnapshotCache,
      refreshFollowingInBackground: refreshFollowingInBackground,
      findModel: findModel,
      invokeModelAction: invokeModelAction,
      dispatchEvent: dispatchEvent,
      updateCollection: updateCollection
    };
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== "TN_OFFSCREEN_RPC") {
      return;
    }

    handleRpc(message, sendResponse);
    return true;
  });

  bindStateEvents();
  ensureLegacyRuntime()
    .then(function () {
      return prepareSnapshotState({ refreshIfEmpty: true });
    })
    .then(function () {
      emitSnapshot("ready");
    })
    .catch(function (err) {
      debugLog("ready.error", {
        message: err && err.message || String(err)
      });
      emitSnapshot("ready-error");
    });
})(this);
