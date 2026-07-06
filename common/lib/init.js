(function (){
  window.onload = function (){
    if (window.popupStateClient && window.popupStateClient.ready) {
      window.popupStateClient.ready(function () {
        app.init();
      });
      return;
    }
    app.init();
  }
})();
