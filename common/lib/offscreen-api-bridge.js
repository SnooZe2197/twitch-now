(function (root) {
  "use strict";

  root.__OFFSCREEN_BACKGROUND__ = true;

  var nativeChrome = root.chrome;
  var listenerMap = {
    "runtime.onMessage": [],
    "tabs.onUpdated": [],
    "notifications.onClicked": [],
    "notifications.onClosed": [],
    "storage.onChanged": []
  };

  function loadLocaleMessages() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", nativeChrome.runtime.getURL("_locales/en/messages.json"), false);
      xhr.send();
      return JSON.parse(xhr.responseText || "{}");
    } catch (err) {
      return {};
    }
  }

  var localeMessages = loadLocaleMessages();

  function addListener(eventName, callback) {
    listenerMap[eventName].push(callback);
  }

  function call(api, method, args, callback) {
    nativeChrome.runtime.sendMessage({
      type: "BRIDGE_API_CALL",
      api: api,
      method: method,
      args: args || []
    }, function (response) {
      if (callback) {
        callback(response && response.ok ? response.data : undefined);
      }
    });
  }

  function apiMethod(api, method) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var callback = typeof args[args.length - 1] === "function" ? args.pop() : null;
      call(api, method, args, callback);
    };
  }

  root.chrome = {
    runtime: nativeChrome.runtime,
    i18n: {
      getMessage: function (id) {
        if (nativeChrome.i18n && nativeChrome.i18n.getMessage) {
          return nativeChrome.i18n.getMessage(id);
        }
        return localeMessages[id] && localeMessages[id].message || "";
      }
    },
    action: {
      setBadgeText: apiMethod("action", "setBadgeText"),
      setBadgeBackgroundColor: apiMethod("action", "setBadgeBackgroundColor")
    },
    notifications: {
      create: apiMethod("notifications", "create"),
      clear: apiMethod("notifications", "clear"),
      onClicked: {
        addListener: function (callback) {
          addListener("notifications.onClicked", callback);
        }
      },
      onClosed: {
        addListener: function (callback) {
          addListener("notifications.onClosed", callback);
        }
      }
    },
    scripting: {
      executeScript: apiMethod("scripting", "executeScript")
    },
    storage: {
      sync: {
        get: apiMethod("storage.sync", "get"),
        set: apiMethod("storage.sync", "set")
      },
      local: {
        get: apiMethod("storage.local", "get"),
        set: apiMethod("storage.local", "set"),
        remove: apiMethod("storage.local", "remove")
      },
      session: nativeChrome.storage && nativeChrome.storage.session ? {
        get: apiMethod("storage.session", "get"),
        set: apiMethod("storage.session", "set"),
        remove: apiMethod("storage.session", "remove")
      } : null,
      onChanged: {
        addListener: function (callback) {
          addListener("storage.onChanged", callback);
        }
      }
    },
    tabs: {
      create: apiMethod("tabs", "create"),
      executeScript: apiMethod("tabs", "executeScript"),
      get: apiMethod("tabs", "get"),
      query: apiMethod("tabs", "query"),
      remove: apiMethod("tabs", "remove"),
      update: apiMethod("tabs", "update"),
      onUpdated: {
        addListener: function (callback) {
          addListener("tabs.onUpdated", callback);
        }
      }
    },
    windows: {
      create: apiMethod("windows", "create")
    }
  };

  nativeChrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message && message.type === "BRIDGE_EVENT" && listenerMap[message.event]) {
      listenerMap[message.event].forEach(function (callback) {
        callback.apply(null, message.args || []);
      });
      return;
    }

    if (message && message.type === "BRIDGE_RUNTIME_MESSAGE") {
      if (message.message && message.message.type === "TN_AUTH_START" && root.twitchApi) {
        root.twitchApi.authorize();
      }
      if (message.message && message.message.type === "TN_AUTH_REVOKE" && root.twitchApi) {
        root.twitchApi.revoke();
      }
      var bridgeKeepAlive = false;
      listenerMap["runtime.onMessage"].forEach(function (callback) {
        bridgeKeepAlive = callback(message.message, message.sender || sender || {}, sendResponse || function () {}) === true || bridgeKeepAlive;
      });
      return bridgeKeepAlive;
    }

    var keepAlive = false;
    listenerMap["runtime.onMessage"].forEach(function (callback) {
      keepAlive = callback(message, sender || {}, sendResponse || function () {}) === true || keepAlive;
    });
    return keepAlive;
  });

  root.chrome.runtime.onMessage = {
    addListener: function (callback) {
      listenerMap["runtime.onMessage"].push(callback);
    }
  };
})(this);
