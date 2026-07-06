(function (){
  "use strict";

  var root = this;

  function debugLog(event, details) {
    if (root.twitchNowDebugLog) {
      root.twitchNowDebugLog.log(root.__OFFSCREEN_BACKGROUND__ ? "offscreen-twitch-api" : "popup-twitch-api", event, details);
    }
  }

  function isMissingRefreshToken(err) {
    return !!(err && (err.noRefreshToken || err.message === "No refresh token"));
  }

  function canRefreshToken() {
    var tokenData = twitchOauth.get && twitchOauth.get() || {};
    return !!tokenData.refreshToken;
  }

  function waitForOAuthReady(callback) {
    if (!twitchOauth.ready || twitchOauth.isReady()) {
      return false;
    }

    debugLog("oauth.wait-ready");
    twitchOauth.ready(function () {
      debugLog("oauth.ready-resume", {
        hasAccessToken: !!twitchOauth.getAccessToken()
      });
      callback();
    });
    return true;
  }

  function logAjaxFailure(eventName, xhr, details) {
    var response = xhr && (xhr.responseJSON || xhr.responseText);
    debugLog(eventName, $.extend({
      status: xhr && xhr.status,
      response: typeof response == "string" ? response.slice(0, 500) : response
    }, details || {}));
  }

  function logFetchFailure(eventName, res, details) {
    res.clone().text().then(function (text) {
      var parsed = text;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
      }
      debugLog(eventName, $.extend({
        status: res.status,
        response: typeof parsed == "string" ? parsed.slice(0, 500) : parsed
      }, details || {}));
    });
  }

  var TwitchApi = root.TwitchApi = function (clientId){
    if ( !clientId ) throw new Error("clientId is required");
    this.basePath = "https://api.twitch.tv/helix";
    this.userName = "";
    this.userId = "";
    this.clientId = clientId;
    this.timeout = 10 * 1000;
    this.token = "";
    _.extend(this, Backbone.Events);
    this.listen();
  }

  TwitchApi.prototype.isAuthorized = function (){
    return !!this.token;
  }

  TwitchApi.prototype.authorize = function (){
    debugLog("authorize.request", {
      offscreen: !!root.__OFFSCREEN_BACKGROUND__
    });
    if (!root.__OFFSCREEN_BACKGROUND__ && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "TN_AUTH_START" }, function (response) {
        var err = chrome.runtime.lastError;
        debugLog("authorize.response", {
          lastError: err && err.message || "",
          ok: !!(response && response.ok)
        });
        if ( err || !response || response.ok === false ) {
          console.error("Unable to start Twitch authorization through service worker", err || response);
          twitchOauth.authorize(function () {
          });
        }
      });
      return;
    }
    twitchOauth.authorize(function (){
    })
  }

  TwitchApi.prototype.revoke = function (){
    debugLog("revoke.request", {
      offscreen: !!root.__OFFSCREEN_BACKGROUND__,
      hadToken: !!this.token
    });
    if (!root.__OFFSCREEN_BACKGROUND__ && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "TN_AUTH_REVOKE" }, function (response) {
        var err = chrome.runtime.lastError;
        debugLog("revoke.response", {
          lastError: err && err.message || "",
          ok: !!(response && response.ok)
        });
        if ( err || !response || response.ok === false ) {
          console.error("Unable to revoke Twitch authorization through service worker", err || response);
          twitchOauth.clearAccessToken();
        }
      });
      return;
    }
    if ( this.token && this.token.length > 0 ) {
      twitchOauth.clearAccessToken();
    }
  }

  TwitchApi.prototype.getRequestParams = function (){
    return {
      timeout : this.timeout,
      dataType: "json",
      headers : {
        "Accept"       : "application/vnd.twitchtv.v5+json",
        "Client-ID"    : this.clientId,
        "Authorization": "Bearer " + this.token
      }
    }
  }

  TwitchApi.prototype.listen = function (){

    var _self = this;

    this.on("tokenchange", function (accessToken){
      _self.token = accessToken;
      debugLog("token.change", {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken ? accessToken.length : 0
      });
      if ( accessToken ) {
        _self.trigger("authorize");
      } else {
        _self.userName = "";
        _self.userId = "";
        _self.trigger("revoke");
      }
    });

    twitchOauth.on("OAUTH2_TOKEN", function (){
      _self.trigger("tokenchange", twitchOauth.getAccessToken());
    })
  }

  function encode(o){
    var r = [];
    for ( var i in o ) {
      if ( o.hasOwnProperty(i) ) {
        r.push(encodeURIComponent(i) + '=' + encodeURIComponent(o[i]));
      }
    }
    return r.join('&');
  }

  TwitchApi.prototype.getUserName = function (cb, retryOnUnauthorized){
    var _self = this
      , userName = _self.userName
      , err = {
        err: "cant get current username"
      }
      , req = {
        url: _self.basePath + "/users"
      }
      ;
    if (waitForOAuthReady(function () {
      _self.getUserName(cb, retryOnUnauthorized);
    })) {
      return;
    }

    console.log('userName: ' + userName)
    if ( userName ) return cb(null, userName);

    $.ajax($.extend(true, req, _self.getRequestParams()))
      .fail(function (xhr){
        logAjaxFailure("user.fail", xhr, {
          retryOnUnauthorized: retryOnUnauthorized !== false,
          canRefreshToken: canRefreshToken()
        });
        if ( xhr.status == 401 && retryOnUnauthorized !== false && canRefreshToken() && twitchOauth.refreshAccessToken ) {
          return twitchOauth.refreshAccessToken(function (refreshErr) {
            if ( refreshErr ) {
              debugLog("user.refresh.fail", {
                message: refreshErr && (refreshErr.message || refreshErr.error || refreshErr.status) || String(refreshErr)
              });
              if ( !isMissingRefreshToken(refreshErr) ) {
                _self.revoke();
              }
              return cb(err);
            }
            _self.userName = "";
            return _self.getUserName(cb, false);
          });
        }
        if ( xhr.status == 401 && canRefreshToken() ) {
          debugLog("user.revoke.after401");
          _self.revoke();
        }
        return cb(err);
      })
      .done(function (res){
        debugLog("user.done", {
          hasData: !!(res && res.data && res.data[0]),
          displayName: res && res.data && res.data[0] && res.data[0].display_name || ""
        });
        if ( !res.data[0].display_name ) {
          return cb(err);
        }
        
        _self.userId = res.data[0].id;
        _self.userName = userName = res.data[0].display_name;
        _self.trigger("userid");
        return cb(null, userName);
      });
  }

  TwitchApi.prototype.send = function (methodName, opts, cb, retryOnUnauthorized){
    var _self = this;

    if (waitForOAuthReady(function () {
      _self.send(methodName, opts, cb, retryOnUnauthorized);
    })) {
      return;
    }

    var requestOpts = _self.methods[methodName]();

    var getUserName = /users|:user_id|:user_name/.test(requestOpts.url) ?
      _self.getUserName :
      function (fn){
        return fn();
      }

    requestOpts.url = requestOpts.url.replace(/:(\w+)/g, function (substr, match){
      return opts[match] || ":" + match;
    });

    getUserName.call(_self, function (err, userName){
      cb = cb || $.noop;
      if ( err ) return cb(err);

      //rewrite basePath if full url provided by requestOpts
      requestOpts.url = /^http/.exec(requestOpts.url) ? requestOpts.url : _self.basePath + requestOpts.url;
      requestOpts.url = requestOpts.url.replace(/:user_name/, userName);
      requestOpts.url = requestOpts.url.replace(/:user_id/, _self.userId);
      requestOpts = $.extend(true, requestOpts, {data: opts}, _self.getRequestParams());

      var url = new URL(requestOpts.url);

      if ( requestOpts.type == "GET" && requestOpts.data ) {
        Object
          .keys(requestOpts.data)
          .forEach(function(key) {
            return url.searchParams.append(key, requestOpts.data[key]);
          });
      }

      var _h = new Headers();
      for ( var i in requestOpts.headers ) {
        _h.append(i, requestOpts.headers[i]);
      }

      var _ropts = {
        method  : requestOpts.type,
        headers : _h,
        redirect: 'follow',
      }
      if ( requestOpts.type != "GET" && requestOpts.type != "HEAD" ) {
        if ( requestOpts.data ) {
          _ropts.headers.append('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
          _ropts.body = encode(requestOpts.data);
        }
      }

      var _r = new Request(url, _ropts);
      debugLog("send.request", {
        methodName: methodName,
        hasToken: !!_self.token,
        tokenLength: _self.token ? _self.token.length : 0,
        userId: _self.userId,
        url: url.toString()
      });

      fetch(_r).then(function (res){
        debugLog("send.response", {
          methodName: methodName,
          status: res.status
        });
        if ( res.status == 401 && retryOnUnauthorized !== false && canRefreshToken() && twitchOauth.refreshAccessToken ) {
          return twitchOauth.refreshAccessToken(function (refreshErr) {
            if ( refreshErr ) {
              debugLog("send.refresh.fail", {
                methodName: methodName,
                message: refreshErr && (refreshErr.message || refreshErr.error || refreshErr.status) || String(refreshErr)
              });
              if ( !isMissingRefreshToken(refreshErr) ) {
                _self.revoke();
              }
              _self.trigger("fail:" + methodName);
              return cb({err: "unauthorized", status: 401});
            }
            return _self.send(methodName, opts, cb, false);
          });
        }
        if ( res.status >= 400 ) {
          logFetchFailure("send.fail.response", res, {
            methodName: methodName,
            url: url.toString()
          });
          _self.trigger("fail:" + methodName);
          return res.json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              cb({err: "http", status: res.status, data: data});
            });
        }
        if ( res.status == 204 ) {
          _self.trigger("done:" + methodName);
          return cb(null, res);
        }
        res.json().then(function (data){

          if ( /^(streams|searchStreams|followed)$/.test(methodName) ) {
            if ( data.data && data.data.length ) {
              data.data = data.data.map(function (s) {
                if ( s.thumbnail_url && typeof s.thumbnail_url == "string" ) {
                  s.thumbnail_url = s.thumbnail_url.replace(/{width}/, 134)
                  s.thumbnail_url = s.thumbnail_url.replace(/{height}/, 70)
                }
                if (s.display_name && typeof s.display_name == "string" && methodName == "searchStreams") {
                  s.user_name = s.display_name
                  s.user_login = s.broadcaster_login
                } else if (methodName == "followed" && !s.user_name) {
                  s.user_name = s.user_login
                }
                return s;
              })
            }
          }
          _self.trigger("done:" + methodName);
          cb(null, data);
        })
      })
        .catch(function (res){
          _self.trigger("fail:" + methodName);
          cb({err: "err" + methodName, status: res.status});
        })
    });
  }

  var methods = TwitchApi.prototype.methods = {};

  methods.base = function (){
    return {
      type: "GET",
      url : "/"
    }
  }

  methods.user = function (){
    return {
      type: "GET",
      url : "/users"
    }
  }

  methods.gameVideos = function (){
    return {
      type: "GET",
      url : "/videos"
    }
  }

  methods.channelVideos = function (){
    return {
      type: "GET",
      url : "/videos/:channel/videos"
    }
  }

  methods.searchGames = function (){
    return {
      type: "GET",
      url : "/search/categories",
      data: {
        limit: 50
      }
    }
  }

  methods.searchStreams = function (){
    return {
      type: "GET",
      url : "/search/channels"
    }
  }

  methods.gamesTop = function (){
    return {
      type: "GET",
      url : "/games/top"
    }
  }

  methods.follows = function (){
    return {
      type: "GET",
      url : "/users/follows?from_id=:user_id"
    }
  }

  methods.hosts = function (){
    return {
      type: "GET",
      url : "https://api.twitch.tv/api/users/:user_name/followed/hosting",
      data: {
        limit: 100
      }
    }
  }

  methods.followedgames = function (){
    return {
      type: "GET",
      url : "https://api.twitch.tv/helix/users/:user_id/follows/games",
      data: {
        limit: 100
      }
    }
  }

  methods.gameFollow = function (){
    return {
      type: "PUT",
      url : "https://api.twitch.tv/api/users/:user_name/follows/games/follow"
    }
  }

  methods.gameUnfollow = function (){
    return {
      type: "DELETE",
      url : "https://api.twitch.tv/api/users/:user_name/follows/games/unfollow"
    }
  }

  methods.follow = function (){
    return {
      type: "PUT",
      url : "/users/:user_id/follows/channels/:target"
    }
  }

  methods.unfollow = function (){
    return {
      type: "DELETE",
      url : "/users/:user_id/follows/channels/:target"
    }
  }

  methods.followed = function (){
    return {
      type: "GET",
      url : "/streams/followed?user_id=:user_id"
    }
  }

  methods.streams = function (){
    return {
      type: "GET",
      url : "/streams"
    }
  }

  root.twitchApi = new TwitchApi(utils.getConstants().twitchApi.client_id);

}).call(this);
