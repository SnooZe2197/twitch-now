window.onerror = function (msg, url, line, column, err){
  var msgError = msg + " in " + url + " (line: " + line + ")";
  console.error(msgError);
  if (window.twitchNowDebugLog) {
    window.twitchNowDebugLog.log(window.__OFFSCREEN_BACKGROUND__ ? "offscreen-window" : "popup-window", "window.error", {
      msg: msg,
      url: url,
      line: line,
      column: column,
      trace: err && err.stack || ""
    });
  }

  chrome.runtime.sendMessage({
    action: "stat",
    method: "sendEvent",
    args  : [
      "Errors",
      chrome.runtime.getManifest().version,
      {
        ua   : window.navigator.userAgent,
        msg  : msg,
        url  : url,
        line : line,
        trace: err && err.stack || ""
      }
    ]
  })
};
