(function (root) {
  "use strict";

  var readyCallbacks = [];
  var ready = false;
  var requestId = 0;
  var bg = {};
  var authorized = false;
  var DEFAULT_SETTINGS = [
    { id: "defaultTab", value: "following", type: "select", show: true },
    { id: "themeType", value: "white", type: "radio", show: true },
    { id: "simpleView", value: false, type: "checkbox", show: true },
    { id: "viewSort", value: "viewer_count|-1", type: "select", show: true },
    { id: "openStreamIn", value: "newlayout", type: "radio", show: true },
    { id: "openChatIn", value: "newwindow", type: "radio", show: true },
    { id: "showBadge", value: true, type: "checkbox", show: true },
    { id: "hideVodcasts", value: false, type: "checkbox", show: false },
    { id: "showDesktopNotification", value: true, type: "checkbox", show: true },
    { id: "invertNotification", value: true, type: "checkbox", show: true },
    { id: "notifyCount", value: true, type: "checkbox", show: true },
    { id: "playNotificationSound", value: false, type: "checkbox", show: true },
    { id: "loopNotificationSound", value: false, type: "checkbox", show: false },
    { id: "notificationSound", value: "common/audio/ding.ogg", type: "radio", show: true },
    { id: "notificationVolume", value: 100, type: "range", show: true },
    { id: "refreshInterval", value: 5, type: "range", show: true },
    { id: "streamLanguage2", value: "any", type: "select", show: true }
  ];

  function debugLog(event, details) {
    if (root.twitchNowDebugLog) {
      root.twitchNowDebugLog.log("popup-state-client", event, details);
    }
  }

  function rpc(command, payload, callback) {
    chrome.runtime.sendMessage({
      type: "TN_RPC",
      requestId: ++requestId,
      command: command,
      payload: payload || {}
    }, function (response) {
      var err = chrome.runtime.lastError;
      if (err) {
        debugLog("rpc.error", { command: command, message: err.message });
        if (callback) callback(err);
        return;
      }
      if (response && response.snapshot) {
        applySnapshot(response.snapshot);
      }
      if (callback) callback(response && response.ok ? null : response && response.error || null, response && response.data);
    });
  }

  var ProxyModel = Backbone.Model.extend({
    initialize: function (attrs, opts) {
      opts = opts || {};
      this.rpcCollection = opts.rpcCollection || this.rpcCollection;
      this.rpcModelName = opts.rpcModelName || this.rpcModelName;
    },
    rpcAction: function (action, args, callback) {
      rpc("MODEL_ACTION", {
        collection: this.rpcCollection,
        modelName: this.rpcModelName,
        id: this.id,
        attributes: this.toJSON(),
        action: action,
        args: args || []
      }, callback);
    },
    follow: function (callback) {
      this.rpcAction("follow", [], callback);
    },
    unfollow: function (callback) {
      this.rpcAction("unfollow", [], callback);
    },
    openStream: function (type, callback) {
      if (typeof type === "function") {
        callback = type;
        type = null;
      }
      this.rpcAction("openStream", type ? [type] : [], callback);
    },
    openChat: function (callback) {
      this.rpcAction("openChat", [], callback);
    },
    openMultitwitch: function (callback) {
      this.rpcAction("openMultitwitch", [], callback);
    },
    openProfilePage: function () {
      this.rpcAction("openProfilePage");
    },
    openChannelPage: function () {
      this.rpcAction("openChannelPage");
    },
    change: function (gameName) {
      this.rpcAction("change", [gameName]);
    }
  });

  var UserModel = ProxyModel.extend({
    login: function () {
      rpc("AUTH_START");
    },
    logout: function () {
      rpc("AUTH_REVOKE");
    }
  });

  var RpcCollection = Backbone.Collection.extend({
    model: ProxyModel,
    initialize: function (models, opts) {
      opts = opts || {};
      this.rpcName = opts.rpcName;
      this.pagination = !!opts.pagination;
      this.updating = false;
      this.lastErrorMessage = "";
    },
    _prepareModel: function (attrs, options) {
      options = options || {};
      options.rpcCollection = this.rpcName;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },
    applySnapshot: function (snap) {
      snap = snap || {};
      this.updating = !!snap.updating;
      this.pagination = !!snap.pagination;
      ["pageQuery", "query", "channel", "game", "gameid", "langFilter", "enableLanguage"].forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(snap, key)) {
          this[key] = snap[key];
        }
      }, this);
      this.lastErrorMessage = snap.lastErrorMessage || "";
      this.reset(snap.items || [], { silent: true });
      this.trigger("reset");
      this.trigger("update");
    },
    stateForRpc: function () {
      return {
        query: this.query,
        channel: this.channel,
        game: this.game,
        gameid: this.gameid,
        langFilter: this.langFilter,
        enableLanguage: this.enableLanguage
      };
    },
    update: function (query, opts, callback) {
      var self = this;
      this.updating = true;
      this.trigger("update-status", true, opts || { reset: true });
      rpc("COLLECTION_UPDATE", {
        name: this.rpcName,
        query: query || {},
        opts: opts || { reset: true },
        state: this.stateForRpc()
      }, function (err, data) {
        self.updating = false;
        self.trigger("update-status", false, opts || { reset: true });
        if (err) {
          self.lastErrorMessage = err.status === 401 ? "auth" : "api";
          self.trigger("_error", self.lastErrorMessage);
          if (callback) callback(err);
          return;
        }
        if (callback) callback(null, data);
      });
    },
    loadNext: function () {
      rpc("COLLECTION_LOAD_NEXT", { name: this.rpcName });
    },
    disableLanguageFilter: function () {
      this.langFilter = false;
      rpc("MODEL_ACTION", { collection: this.rpcName, action: "disableLanguageFilter" });
    },
    enableLanguageFilter: function () {
      this.langFilter = true;
      rpc("MODEL_ACTION", { collection: this.rpcName, action: "enableLanguageFilter" });
    }
  });

  var SettingsCollection = RpcCollection.extend({
    set: function (models, options) {
      var result = Backbone.Collection.prototype.set.apply(this, arguments);
      if (Array.isArray(models) && !(options && options.silent)) {
        rpc("SETTINGS_SET", { settings: this.toJSON() });
      }
      return result;
    },
    getNotificationSoundSource: function () {
      var control = this.get("notificationSound");
      var value = control && control.get("value");
      return value === "customsound" ? localStorage["customSound"] : value;
    }
  });

  var NotificationCollection = RpcCollection.extend({
    store: function () {
      rpc("MODEL_ACTION", { collection: this.rpcName, action: "store" });
    },
    restore: function () {
      rpc("MODEL_ACTION", { collection: this.rpcName, action: "restore" });
    },
    saveToStorage: function () {
      rpc("MODEL_ACTION", { collection: this.rpcName, action: "saveToStorage" });
    }
  });

  function makeCollection(name, CollectionClass, ModelClass) {
    var C = CollectionClass || RpcCollection;
    var c = new C([], { rpcName: name });
    if (ModelClass) {
      c.model = ModelClass;
    }
    bg[name] = c;
    return c;
  }

  var StreamModel = ProxyModel.extend({});
  var GameModel = ProxyModel.extend({});
  var ChannelModel = ProxyModel.extend({});
  var ControlModel = ProxyModel.extend({});
  var dispatcher = _.clone(Backbone.Events);
  var dispatcherTrigger = dispatcher.trigger;

  dispatcher.trigger = function (eventName) {
    rpc("DISPATCH_EVENT", {
      event: eventName,
      args: Array.prototype.slice.call(arguments, 1)
    });
    return dispatcherTrigger.apply(this, arguments);
  };

  bg.bgApp = {
    dispatcher: dispatcher,
    playSound: function () {
      rpc("PLAY_SOUND", { args: Array.prototype.slice.call(arguments) });
    }
  };

  bg.twitchApi = _.extend({
    isAuthorized: function () {
      return authorized;
    }
  }, Backbone.Events);

  bg.user = new UserModel();
  bg.badge = new ProxyModel();
  bg.gameLobby = new ProxyModel({}, { rpcModelName: "gameLobby" });
  makeCollection("settings", SettingsCollection, ControlModel).reset(DEFAULT_SETTINGS, { silent: true });
  makeCollection("contributors");
  makeCollection("notifications", NotificationCollection, ChannelModel);
  makeCollection("followedgames", RpcCollection, GameModel);
  makeCollection("topstreams", RpcCollection, StreamModel);
  makeCollection("following", RpcCollection, StreamModel);
  makeCollection("videos");
  makeCollection("games", RpcCollection, GameModel);
  makeCollection("search", RpcCollection, StreamModel);
  makeCollection("gameVideos");
  makeCollection("gameStreams", RpcCollection, StreamModel);
  makeCollection("followedChannels", RpcCollection, ChannelModel);

  root.__backgroundPage = bg;

  function applyAuth(auth) {
    var nextAuthorized = !!(auth && auth.authorized);
    var userPatch = {
      authenticated: nextAuthorized
    };

    if (auth && auth.userName && !bg.user.get("name")) {
      userPatch.name = auth.userName;
    }

    debugLog("AUTH_STATE", {
      authorized: nextAuthorized,
      userId: auth && auth.userId || "",
      userName: auth && auth.userName || ""
    });

    if (nextAuthorized !== authorized) {
      authorized = nextAuthorized;
      bg.twitchApi.trigger(nextAuthorized ? "authorize" : "revoke");
    } else {
      authorized = nextAuthorized;
    }
    if (auth && auth.userId) {
      bg.twitchApi.trigger("userid");
    }
    bg.user.set(userPatch);
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    applyAuth(snapshot.auth);
    bg.user.set($.extend({}, snapshot.user || {}, { authenticated: authorized }));
    bg.badge.set(snapshot.badge || {});
    bg.gameLobby.set(snapshot.gameLobby || {});

    Object.keys(snapshot.collections || {}).forEach(function (name) {
      if (bg[name] && bg[name].applySnapshot) {
        bg[name].applySnapshot(snapshot.collections[name]);
      }
    });
  }

  function markReady() {
    if (ready) return;
    ready = true;
    readyCallbacks.splice(0).forEach(function (callback) {
      callback();
    });
  }

  var port = chrome.runtime.connect({ name: "TN_POPUP_PORT" });
  port.onMessage.addListener(function (message) {
    if (message && message.type === "SNAPSHOT") {
      applySnapshot(message.snapshot);
    }
    if (message && message.type === "AUTH_STATE") {
      applyAuth(message.auth);
    }
  });

  root.popupStateClient = {
    ready: function (callback) {
      if (ready) return callback();
      readyCallbacks.push(callback);
    },
    refresh: function () {
      rpc("GET_SNAPSHOT", {}, function () {
        markReady();
      });
    },
    applySnapshot: applySnapshot
  };

  if (root.__TN_ENABLE_TEST_HOOKS__) {
    root.__popupStateClientTest = {
      bg: bg,
      applyAuth: applyAuth,
      applySnapshot: applySnapshot
    };
  }

  root.popupStateClient.refresh();
})(this);
