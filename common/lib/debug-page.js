(function () {
  "use strict";

  var KEY = "twitchNowDebugLog";
  var output = document.getElementById("log");

  function render() {
    chrome.storage.local.get(KEY, function (item) {
      output.textContent = JSON.stringify(item[KEY] || [], null, 2);
    });
  }

  document.getElementById("refresh").addEventListener("click", render);
  document.getElementById("copy").addEventListener("click", function () {
    navigator.clipboard.writeText(output.textContent || "");
  });
  document.getElementById("clear").addEventListener("click", function () {
    chrome.storage.local.remove(KEY, render);
  });

  render();
})();
