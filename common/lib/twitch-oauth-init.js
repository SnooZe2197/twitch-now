var twitchOauth = (typeof globalThis !== "undefined" && globalThis.twitchOauth) || OAuth2.addAdapter({
  id      : "twitch",
  codeflow: {
    method: "POST",
    url   : "https://id.twitch.tv/oauth2/token"
  },
  opts    : constants.twitchApi
});

if (typeof globalThis !== "undefined") {
  globalThis.twitchOauth = twitchOauth;
  if (globalThis.twitchNowDebugLog) {
    globalThis.twitchNowDebugLog.log("twitch-oauth-init", "oauth.adapter.created", {
      hasOAuth: !!globalThis.twitchOauth,
      hasSet: !!(globalThis.twitchOauth && globalThis.twitchOauth.set)
    });
  }
}
