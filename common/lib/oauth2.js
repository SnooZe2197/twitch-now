(function () {
  var root = this;
  var that = {};
  var isFirefox = !!root.browser;
  var _browser = isFirefox ? root.browser : chrome;

  function noop() {
  }

  function debugLog(event, details) {
    if (root.twitchNowDebugLog) {
      root.twitchNowDebugLog.log(root.__OFFSCREEN_BACKGROUND__ ? "offscreen-oauth2" : "popup-oauth2", event, details);
    }
  }

  that._adapters = {};

  function extend() {
    var s = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      for (var j in arguments[i]) {
        s[j] = arguments[i][j];
      }
    }
  }

  var request = function (opts, callback) {
    var $ = root.jQuery;
    $.ajax({
      url: opts.url,
      type: opts.method,
      data: opts.data
    })
      .always(function (data, textStatus, jqXHR) {
        if (textStatus == "success") {
          callback(null, data);
        } else {
          callback(data);
        }
      });
  }

  var requestForm = function (opts, callback) {
    fetch(opts.url, {
      method: opts.method || "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
      },
      body: opts.data
    })
      .then(function (res) {
        return res.json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (res.ok) {
              callback(null, data);
            } else {
              callback(data);
            }
          });
      })
      .catch(function (err) {
        callback(err);
      });
  }

  var Adapter = function (id, opts, flow) {
    this.lsPath = "oauth2_" + id;
    this.opts = opts;
    this.responseType = this.opts.response_type;
    this.secret = this.opts.client_secret;
    this.redirect = this.opts.redirect_uri.replace(/https*:\/\//i, "");
    delete this.opts.client_secret;
    this.flow = flow;
    this.codeUrl = opts.api + "?" + this.query(this.pick(opts, [
      "client_id",
      "force_verify",
      "redirect_uri",
      "response_type",
      "scope",
      "state"
    ]));
    this.devicePollTimer = null;
    this._ready = false;
    this._readyCallbacks = [];
    this._watchInject();
    extend(this, new EventEmitter());
    if (!isFirefox) {
      this.syncGet();
      this.sync();
    } else {
      setTimeout(function () {
        this.trigger("OAUTH2_TOKEN", { value: this.getAccessToken() });
        this._markReady();
      }.bind(this), 2000)
    }
  }

  Adapter.prototype._markReady = function () {
    var callbacks = this._readyCallbacks.splice(0);
    this._ready = true;
    debugLog("ready", {
      hasAccessToken: !!this.getAccessToken(),
      accessTokenLength: this.getAccessToken() ? this.getAccessToken().length : 0
    });
    callbacks.forEach(function (callback) {
      callback();
    });
  }

  Adapter.prototype.isReady = function () {
    return this._ready;
  }

  Adapter.prototype.ready = function (callback) {
    if (this._ready) {
      return callback();
    }
    this._readyCallbacks.push(callback);
  }

  Adapter.prototype._watchInject = function () {
    var self = this;
    var injectScript = '(' + this.injectScript.toString() + ')()';
    var injectTo;

    injectTo = this.redirect;
    if (_browser.tabs && _browser.tabs.onUpdated && _browser.tabs.onUpdated.addListener && _browser.tabs.get && _browser.scripting) {
      _browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
        _browser.tabs.get(tabId, (tab) => {
          if (tab.url && tab.url.indexOf(injectTo) != -1) {
            console.log("\nExecuting scripts");
            _browser.scripting.executeScript({
              target: { tabId: tabId },
              files: ["common/content/oauth-redirect.js"]
            });
          }
        });
      })
    } else {
      debugLog("watch-inject.skipped", {
        hasTabs: !!_browser.tabs,
        hasOnUpdated: !!(_browser.tabs && _browser.tabs.onUpdated),
        hasTabsGet: !!(_browser.tabs && _browser.tabs.get),
        hasScripting: !!_browser.scripting
      });
    }

    if (!_browser.runtime || !_browser.runtime.onMessage || !_browser.runtime.onMessage.addListener) {
      debugLog("runtime-listener.skipped");
      return;
    }

    _browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.type == "OAUTH2") {
        self.finalize(msg.value.params);
        console.log('finalize', sender.tab.id);
        _browser.tabs.remove(sender.tab.id);
      }
    });
  }

  Adapter.prototype.injectScript = function () {

    console.log("\n\nInjecting\n\n");

    var sendMessage = function (msg) {

      var data = {
        value: msg,
        type: "OAUTH2"
      };

      chrome.runtime.sendMessage(data);
    }

    var send = function () {

      var params = window.location.href;

      console.log("\nSending back to background message = ", params);

      sendMessage({ params: params });
    }

    send();

  }

  Adapter.prototype.syncGet = function () {
    var self = this;
    debugLog("sync.get.start", { path: this.lsPath });
    _browser.storage.sync.get(this.lsPath, function (item) {
      console.log("SYNC_GET", item);
      var stored = null;
      if (item[self.lsPath]) {
        try {
          stored = JSON.parse(item[self.lsPath]);
        } catch (err) {
          stored = null;
        }
      }
      debugLog("sync.get.result", {
        path: self.lsPath,
        hasItem: !!item[self.lsPath],
        hasAccessToken: !!(stored && stored.accessToken)
      });
      if (stored && stored.accessToken) {
        self.set(stored, true);
        self._markReady();
        return;
      }
      self.localGet();
    });
  }

  Adapter.prototype.localGet = function () {
    var self = this;
    if (!_browser.storage.local || !_browser.storage.local.get) {
      return this.runtimeGet();
    }

    debugLog("local.get.start", { path: this.lsPath });
    _browser.storage.local.get("oauth2_twitch_cache", function (item) {
      debugLog("local.get.result", {
        hasItem: !!(item && item.oauth2_twitch_cache),
        hasAccessToken: !!(item && item.oauth2_twitch_cache && item.oauth2_twitch_cache.accessToken)
      });
      if (item && item.oauth2_twitch_cache && item.oauth2_twitch_cache.accessToken) {
        self.set(item.oauth2_twitch_cache, true);
        self._markReady();
        return;
      }
      self.runtimeGet();
    });
  }

  Adapter.prototype.runtimeGet = function () {
    var self = this;
    if (!_browser.runtime || !_browser.runtime.sendMessage) {
      self._markReady();
      return;
    }

    debugLog("runtime.get.start", { path: this.lsPath });
    _browser.runtime.sendMessage({ type: "TN_AUTH_STATE" }, function (response) {
      var err = _browser.runtime.lastError;
      debugLog("runtime.get.result", {
        lastError: err && err.message || "",
        ok: !!(response && response.ok),
        hasAccessToken: !!(response && response.token && response.token.accessToken)
      });
      if (!err && response && response.ok && response.token && response.token.accessToken) {
        self.set(response.token, true);
      }
      self._markReady();
    });
  }

  Adapter.prototype.sync = function () {
    var self = this;
    _browser.storage.onChanged.addListener(function (changes, namespace) {
      if (namespace === "sync") {
        console.log("SYNC_CHANGED", changes);
        if (self.lsPath in changes) {
          debugLog("sync.changed", {
            path: self.lsPath,
            hasNewValue: !!changes[self.lsPath].newValue
          });
          self.set(JSON.parse(changes[self.lsPath].newValue), true);
        }
      }
    });
  }

  Adapter.prototype.del = function (/*keys*/) {
    delete localStorage[this.lsPath];
  }

  Adapter.prototype.get = function () {
    return typeof localStorage[this.lsPath] != "undefined" ?
      JSON.parse(localStorage[this.lsPath]) :
      undefined;
  }

  Adapter.prototype.set = function (val, passSync) {
    localStorage[this.lsPath] = JSON.stringify(val);
    debugLog("token.set", {
      path: this.lsPath,
      passSync: !!passSync,
      hasAccessToken: !!(val && val.accessToken),
      accessTokenLength: val && val.accessToken ? val.accessToken.length : 0,
      hasRefreshToken: !!(val && val.refreshToken)
    });


    if (!isFirefox && passSync == undefined) {
      var syncData = {};
      syncData[this.lsPath] = JSON.stringify(val);

      console.log("set sync data", syncData);

      _browser.storage.sync.set(syncData, function () {
        console.log("SYNC_SET_DONE", arguments);
      });
    }

    this.trigger("OAUTH2_TOKEN", { value: this.getAccessToken() });
  }

  Adapter.prototype.updateLocalStorage = function () {
    var stored = this.get();
    stored = stored || { accessToken: "" };
    stored.accessToken = stored.accessToken || "";
    this.set(stored);
  }


  Adapter.prototype.pick = function (obj, params) {
    var res = {};
    for (var i in obj) {
      if (~params.indexOf(i) && obj.hasOwnProperty(i)) {
        res[i] = obj[i];
      }
    }
    return res;
  }

  Adapter.prototype.query = function (o) {
    var res = [];
    for (var i in o) {
      res.push(encodeURIComponent(i) + "=" + encodeURIComponent(o[i]));
    }
    return res.join("&");
  }

  Adapter.prototype.parseAccessToken = function (url) {
    var error = url.match(/[&\?]error=([^&]+)/);
    if (error) {
      throw new Error('Error getting access token: ' + error[1]);
    }
    return url.match(/[&#]access_token=([\w\/\-]+)/)[1];
  }

  Adapter.prototype.parseAuthorizationCode = function (url) {
    var error = url.match(/[&\?]error=([^&]+)/);
    if (error) {
      throw new Error('Error getting authorization code: ' + error[1]);
    }
    return url.match(/[&\?]code=([\w\/\-]+)/)[1];
  }

  Adapter.prototype.authorize = function (callback) {
    this._callback = callback;
    if (this.opts.device_flow) {
      return this.authorizeWithDeviceCode(callback || noop);
    }
    this.openTab(this.codeUrl);
  }

  Adapter.prototype.authorizeWithDeviceCode = function (callback) {
    var self = this;
    var deviceUrl = this.opts.device_url || "https://id.twitch.tv/oauth2/device";
    var tokenUrl = this.opts.token_url || this.flow.url;
    var scope = this.opts.scope || "";
    var startedAt = Date.now();
    var interval = 5;

    if (this.devicePollTimer) {
      clearTimeout(this.devicePollTimer);
      this.devicePollTimer = null;
    }

    requestForm({
      url: deviceUrl,
      data: this.query({
        client_id: this.opts.client_id,
        scopes: scope
      })
    }, function (err, data) {
      if (err) {
        return callback(err);
      }

      interval = Number(data.interval) || interval;
      self.openTab(data.verification_uri);

      var poll = function () {
        if (Date.now() - startedAt > (Number(data.expires_in) || 1800) * 1000) {
          return callback(new Error("Device authorization expired"));
        }

        requestForm({
          url: tokenUrl,
          data: self.query({
            client_id: self.opts.client_id,
            scopes: scope,
            device_code: data.device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code"
          })
        }, function (pollErr, tokenData) {
          var message = pollErr && (pollErr.message || pollErr.error || pollErr.status);

          if (!pollErr) {
            self.setTokenData(tokenData);
            return callback();
          }

          if (message === "authorization_pending") {
            self.devicePollTimer = setTimeout(poll, interval * 1000);
            return;
          }

          if (message === "slow_down") {
            interval += 5;
            self.devicePollTimer = setTimeout(poll, interval * 1000);
            return;
          }

          callback(pollErr);
        });
      };

      self.devicePollTimer = setTimeout(poll, interval * 1000);
    });
  }

  Adapter.prototype.finalize = function (params) {
    var self = this;
    var callback = self._callback || noop;
    var code;
    var token;

    console.log("\nSelf response type", self.responseType);
    if (self.responseType == "code") {
      try {
        code = this.parseAuthorizationCode(params);
      } catch (err) {
        console.log("\n\nerror parsing auth code\n\n");
        return callback(err);
      }

      this.getAccessAndRefreshTokens(code, function (err, data) {
        if (!err) {
          console.log("\n\nRecieve access token = ", data.access_token);
          self.setTokenData(data);
          callback();
        } else {
          callback(err);
        }
      })
    }

    if (self.responseType == "token") {
      try {
        self.setAccessToken(self.parseAccessToken(params));
      } catch (err) {
        return callback(err);
      }
      callback();
    }
  }

  Adapter.prototype.getAccessAndRefreshTokens = function (authorizationCode, callback) {

    var method = this.flow.method;
    var url = this.flow.url;
    var data = this.opts;

    data["grant_type"] = "authorization_code";
    data["code"] = authorizationCode;
    data["client_secret"] = this.secret;

    var values = this.pick(data, ["client_id", "client_secret", "grant_type", "redirect_uri", "code"]);

    request({ url: url, method: method, data: values }, callback)
  }

  Adapter.prototype.refreshAccessToken = function (callback) {
    var data = this.get() || {};
    var refreshToken = data.refreshToken;
    var tokenUrl = this.opts.token_url || this.flow.url;
    var self = this;

    callback = callback || noop;

    if (!refreshToken) {
      debugLog("token.refresh.missing");
      var missingRefreshTokenError = new Error("No refresh token");
      missingRefreshTokenError.noRefreshToken = true;
      return callback(missingRefreshTokenError);
    }

    debugLog("token.refresh.start");
    requestForm({
      url: tokenUrl,
      data: this.query({
        client_id: this.opts.client_id,
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    }, function (err, tokenData) {
      if (err) {
        debugLog("token.refresh.error", {
          message: err && (err.message || err.error || err.status) || String(err)
        });
        return callback(err);
      }

      self.setTokenData(tokenData);
      debugLog("token.refresh.done", {
        hasAccessToken: !!tokenData.access_token
      });
      callback(null, self.getAccessToken());
    });
  }

  Adapter.prototype.openTab = function (url) {
    _browser.tabs.create({ url: url });
  }

  Adapter.prototype.setAccessToken = function (token) {
    this.set({ accessToken: token });
  }

  Adapter.prototype.setTokenData = function (data) {
    this.set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope
    });
  }

  Adapter.prototype.hasAccessToken = function () {
    var g = this.get();
    return !!(g && g.accessToken);
  }

  Adapter.prototype.getAccessToken = function () {
    return this.hasAccessToken() ? this.get().accessToken : "";
  }

  Adapter.prototype.clearAccessToken = function () {
    console.log("clear access token");
    debugLog("token.clear");
    var data = this.get() || {};
    delete data.accessToken;
    delete data.refreshToken;
    delete data.expiresIn;
    delete data.tokenType;
    delete data.scope;
    this.set(data);
  }

  that.lookupAdapter = function (url) {
    console.log("lookup adapter for url = ", url);
    var adapters = that._adapters;
    for (var i in adapters) {
      if (adapters[i].opts.redirect_uri == url) {
        return adapters[i];
      }
    }
  }

  that.addAdapter = function (opts) {
    var id = opts.id;
    var adapter = that._adapters[id];
    if (!adapter) {
      adapter = that._adapters[id] = new Adapter(id, opts.opts, opts.codeflow);
    }
    return adapter;
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = that;
    }
    exports.OAuth2 = that;
  } else {
    root.OAuth2 = that;
  }

}).call(this);
