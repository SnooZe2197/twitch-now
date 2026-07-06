(function (root) {
  "use strict";

  var KEY = "twitchNowDebugLog";
  var MAX_ENTRIES = 300;

  function safe(value) {
    if (!value || typeof value !== "object") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(safe);
    }

    var copy = {};
    Object.keys(value).forEach(function (key) {
      if (/token|secret|authorization/i.test(key) && typeof value[key] === "string") {
        copy[key] = value[key] ? "[redacted:" + String(value[key]).length + "]" : value[key];
        return;
      }
      copy[key] = safe(value[key]);
    });
    return copy;
  }

  function storageLog(entry) {
    if (!root.chrome || !chrome.storage || !chrome.storage.local) {
      return;
    }

    chrome.storage.local.get(KEY, function (item) {
      var logs = item && Array.isArray(item[KEY]) ? item[KEY] : [];
      logs.push(entry);
      if (logs.length > MAX_ENTRIES) {
        logs = logs.slice(logs.length - MAX_ENTRIES);
      }
      chrome.storage.local.set({ twitchNowDebugLog: logs });
    });
  }

  function log(source, event, details) {
    var entry = {
      time: new Date().toISOString(),
      source: source,
      event: event,
      details: safe(details || {})
    };

    if (root.console && console.log) {
      console.log("[TwitchNow]", entry.source, entry.event, entry.details);
    }

    try {
      storageLog(entry);
    } catch (err) {
      if (root.console && console.warn) {
        console.warn("[TwitchNow] unable to store debug log", err);
      }
    }
  }

  root.twitchNowDebugLog = {
    key: KEY,
    log: log
  };
})(typeof self !== "undefined" ? self : this);
