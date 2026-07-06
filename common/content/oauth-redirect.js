(function () {
  chrome.runtime.sendMessage({
    type: "OAUTH2",
    value: {
      params: window.location.href
    }
  });
})();
