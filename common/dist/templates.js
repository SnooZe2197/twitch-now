this["Handlebars"] = this["Handlebars"] || {};
this["Handlebars"]["templates"] = this["Handlebars"]["templates"] || {};
this["Handlebars"]["templates"]["channel"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"stream js-filterable\">\n    <div class=\"item-image-container channel-logo offline\">\n        <img class=\"lazy\" alt=\"\" data-original=\""
    + alias4(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"logo","hash":{},"data":data,"loc":{"start":{"line":3,"column":48},"end":{"line":3,"column":56}}}) : helper)))
    + "\"/>\n    </div>\n    <span class=\"stream-info stream-title\">\n            "
    + alias4(((helper = (helper = helpers.to_name || (depth0 != null ? depth0.to_name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"to_name","hash":{},"data":data,"loc":{"start":{"line":6,"column":12},"end":{"line":6,"column":23}}}) : helper)))
    + "\n    </span>\n    <span class=\"stream-info\">\n            "
    + alias4(((helper = (helper = helpers.game || (depth0 != null ? depth0.game : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"game","hash":{},"data":data,"loc":{"start":{"line":9,"column":12},"end":{"line":9,"column":20}}}) : helper)))
    + "\n    </span>\n</div>\n";
},"useData":true});
this["Handlebars"]["templates"]["channelnotification"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing;

  return "<div class=\"stream js-filterable\">\n    <div class=\"item-image-container channel-logo\">\n        <img class=\"lazy\" alt=\"\" data-original=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.logo : stack1), depth0))
    + "\"/>\n    </div>\n    <span class=\"stream-info stream-title\">\n            "
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + "\n    </span>\n    <span class=\"stream-info channel-notifications-options\" data-channel-id=\""
    + alias2(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias4),(typeof helper === "function" ? helper.call(alias3,{"name":"_id","hash":{},"data":data,"loc":{"start":{"line":8,"column":77},"end":{"line":8,"column":84}}}) : helper)))
    + "\">\n        <div class=\"control-wrapper\">\n            <input type=\"checkbox\" data-notification-type=\"desktop\" id=\"dn-"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + "\" "
    + alias2((helpers["h-checked-2"]||(depth0 && depth0["h-checked-2"])||alias4).call(alias3,((stack1 = (depth0 != null ? depth0.notificationOpts : depth0)) != null ? stack1.desktop : stack1),{"name":"h-checked-2","hash":{},"data":data,"loc":{"start":{"line":10,"column":101},"end":{"line":10,"column":141}}}))
    + "/>\n            <label for=\"dn-"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + "\">\n                <span></span>\n\n                <div class=\"control-desc\">Show desktop notification</div>\n            </label>\n        </div>\n        <div class=\"control-wrapper\">\n            <input type=\"checkbox\" data-notification-type=\"sound\" id=\"sn-"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + "\" "
    + alias2((helpers["h-checked-2"]||(depth0 && depth0["h-checked-2"])||alias4).call(alias3,((stack1 = (depth0 != null ? depth0.notificationOpts : depth0)) != null ? stack1.sound : stack1),{"name":"h-checked-2","hash":{},"data":data,"loc":{"start":{"line":18,"column":99},"end":{"line":18,"column":137}}}))
    + "/>\n            <label for=\"sn-"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + "\">\n                <span></span>\n\n                <div class=\"control-desc\">Play sound</div>\n            </label>\n        </div>\n    </span>\n</div>\n";
},"useData":true});
this["Handlebars"]["templates"]["contextgamemenu"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "<!-- <div class=\"context-row js-follow-game\">__MSG_m83__</div> -->\n<!-- <div class=\"context-row js-unfollow-game\">__MSG_m84__</div> -->\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.authorized : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":4,"column":7}}})) != null ? stack1 : "");
},"useData":true});
this["Handlebars"]["templates"]["contextstreammenu"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "<div class=\"context-row js-follow\">__MSG_m22__</div>\n<div class=\"context-row js-unfollow\">__MSG_m23__</div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<div class=\"context-row js-open-stream\" data-type=\"newlayout\">__MSG_m71__</div>\n<div class=\"context-row js-open-stream\" data-type=\"popout\">__MSG_m17__</div>\n<div class=\"context-row js-open-in-multitwitch\">__MSG_m87__</div>\n<div class=\"context-row js-open-chat\">__MSG_m20__</div>\n<div class=\"context-row\" data-route=\"videos/"
    + container.escapeExpression((helpers["h-enc"]||(depth0 && depth0["h-enc"])||container.hooks.helperMissing).call(alias1,((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1._id : stack1),{"name":"h-enc","hash":{},"data":data,"loc":{"start":{"line":5,"column":44},"end":{"line":5,"column":65}}}))
    + "\">__MSG_m21__</div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.authorized : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":0},"end":{"line":9,"column":7}}})) != null ? stack1 : "");
},"useData":true});
this["Handlebars"]["templates"]["contributor"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"contributor js-tab tip\" title=\""
    + alias4(((helper = (helper = helpers.login || (depth0 != null ? depth0.login : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"login","hash":{},"data":data,"loc":{"start":{"line":1,"column":43},"end":{"line":1,"column":52}}}) : helper)))
    + "\" data-href=\""
    + alias4(((helper = (helper = helpers.html_url || (depth0 != null ? depth0.html_url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"html_url","hash":{},"data":data,"loc":{"start":{"line":1,"column":65},"end":{"line":1,"column":77}}}) : helper)))
    + "\">\n    <img class=\"user-avatar lazy\"\n         alt=\"\"\n         src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7\"\n         data-original=\""
    + alias4(((helper = (helper = helpers.avatar_url || (depth0 != null ? depth0.avatar_url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avatar_url","hash":{},"data":data,"loc":{"start":{"line":5,"column":24},"end":{"line":5,"column":38}}}) : helper)))
    + "s=140\"/>\n</div>";
},"useData":true});
this["Handlebars"]["templates"]["control"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<div class=\"control\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.range : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.radio : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":4},"end":{"line":28,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.button : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":30,"column":4},"end":{"line":34,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.checkbox : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":36,"column":4},"end":{"line":45,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.select : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":47,"column":4},"end":{"line":58,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.mcheckbox : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":60,"column":4},"end":{"line":75,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.text : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":77,"column":4},"end":{"line":82,"column":11}}})) != null ? stack1 : "")
    + "</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <div class=\"control-desc\">"
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":4,"column":30},"end":{"line":4,"column":38}}}) : helper)))
    + "</div>\n    <div class=\"control-wrapper\">\n        <input data-type="
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":6,"column":25},"end":{"line":6,"column":33}}}) : helper)))
    + " data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":6,"column":42},"end":{"line":6,"column":48}}}) : helper)))
    + " type=\"range\" value=\""
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data,"loc":{"start":{"line":6,"column":69},"end":{"line":6,"column":78}}}) : helper)))
    + "\" min=\""
    + alias4(((helper = (helper = helpers.min || (depth0 != null ? depth0.min : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"min","hash":{},"data":data,"loc":{"start":{"line":6,"column":85},"end":{"line":6,"column":92}}}) : helper)))
    + "\" max=\""
    + alias4(((helper = (helper = helpers.max || (depth0 != null ? depth0.max : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"max","hash":{},"data":data,"loc":{"start":{"line":6,"column":99},"end":{"line":6,"column":106}}}) : helper)))
    + "\">\n\n        <div class=\"range-helper\">\n            <span class=\"range-helper-value\"> "
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data,"loc":{"start":{"line":9,"column":46},"end":{"line":9,"column":55}}}) : helper)))
    + " </span> <span>"
    + alias4(((helper = (helper = helpers.tip || (depth0 != null ? depth0.tip : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tip","hash":{},"data":data,"loc":{"start":{"line":9,"column":70},"end":{"line":9,"column":77}}}) : helper)))
    + "</span>\n        </div>\n    </div>\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "    <div class=\"control-desc\">"
    + container.escapeExpression(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":15,"column":30},"end":{"line":15,"column":38}}}) : helper)))
    + "</div>\n    <div class=\"control-wrapper\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.opts : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":8},"end":{"line":26,"column":17}}})) != null ? stack1 : "")
    + "    </div>\n";
},"5":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing, alias5="function";

  return "        <input data-type=\""
    + alias2(alias1((depths[1] != null ? depths[1].type : depths[1]), depth0))
    + "\" id=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":18,"column":48},"end":{"line":18,"column":54}}}) : helper)))
    + "\" data-id="
    + alias2(alias1((depths[1] != null ? depths[1].id : depths[1]), depth0))
    + " name=\""
    + alias2(alias1((depths[1] != null ? depths[1].id : depths[1]), depth0))
    + "\" type=\"radio\"\n               value=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":19,"column":22},"end":{"line":19,"column":28}}}) : helper)))
    + "\" "
    + alias2((helpers["h-checked"]||(depth0 && depth0["h-checked"])||alias4).call(alias3,depth0,depths[1],{"name":"h-checked","hash":{},"data":data,"loc":{"start":{"line":19,"column":30},"end":{"line":19,"column":56}}}))
    + ">\n\n        <label for=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":21,"column":20},"end":{"line":21,"column":26}}}) : helper)))
    + "\">\n            <span></span>\n            <div class=\"radio-tip\">"
    + alias2(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":23,"column":35},"end":{"line":23,"column":43}}}) : helper)))
    + "</div>\n        </label>\n        <br/>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <div class=\"control-wrapper\">\n        <input data-type="
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":32,"column":25},"end":{"line":32,"column":33}}}) : helper)))
    + " data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":32,"column":42},"end":{"line":32,"column":48}}}) : helper)))
    + " type=\"button\" value=\""
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":32,"column":70},"end":{"line":32,"column":78}}}) : helper)))
    + "\">\n    </div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <div class=\"control-wrapper\">\n        <input type=\"checkbox\" id=\""
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":38,"column":35},"end":{"line":38,"column":41}}}) : helper)))
    + "\" data-type="
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":38,"column":53},"end":{"line":38,"column":61}}}) : helper)))
    + " data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":38,"column":70},"end":{"line":38,"column":76}}}) : helper)))
    + " "
    + alias4((helpers["h-checked"]||(depth0 && depth0["h-checked"])||alias2).call(alias1,depth0,{"name":"h-checked","hash":{},"data":data,"loc":{"start":{"line":38,"column":77},"end":{"line":38,"column":96}}}))
    + "/>\n        <label for=\""
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":39,"column":20},"end":{"line":39,"column":26}}}) : helper)))
    + "\">\n            <span></span>\n\n            <div class=\"control-desc\">"
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":42,"column":38},"end":{"line":42,"column":46}}}) : helper)))
    + "</div>\n        </label>\n    </div>\n";
},"11":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <div class=\"control-desc\">"
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":48,"column":30},"end":{"line":48,"column":38}}}) : helper)))
    + "</div>\n    <div class=\"control-wrapper\">\n        <select data-type="
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":50,"column":26},"end":{"line":50,"column":34}}}) : helper)))
    + " data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":50,"column":43},"end":{"line":50,"column":49}}}) : helper)))
    + ">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.opts : depth0),{"name":"each","hash":{},"fn":container.program(12, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":51,"column":12},"end":{"line":54,"column":21}}})) != null ? stack1 : "")
    + "        </select>\n\n    </div>\n";
},"12":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "            <option value=\""
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":52,"column":27},"end":{"line":52,"column":33}}}) : helper)))
    + "\"\n                    "
    + alias4((helpers["h-selected"]||(depth0 && depth0["h-selected"])||alias2).call(alias1,depth0,depths[1],{"name":"h-selected","hash":{},"data":data,"loc":{"start":{"line":53,"column":20},"end":{"line":53,"column":47}}}))
    + " >"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":53,"column":49},"end":{"line":53,"column":57}}}) : helper)))
    + "</option>\n";
},"14":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "    <div class=\"control-desc\">"
    + container.escapeExpression(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":61,"column":30},"end":{"line":61,"column":38}}}) : helper)))
    + "</div>\n    <div class=\"control-wrapper\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.opts : depth0),{"name":"each","hash":{},"fn":container.program(15, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":63,"column":8},"end":{"line":72,"column":17}}})) != null ? stack1 : "")
    + "    </div>\n    <div class=\"clearfix\"></div>\n";
},"15":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing, alias5="function";

  return "        <div class=\"group-wrapper\">\n            <input type=\"checkbox\" data-parent-id=\""
    + alias2(alias1((depths[1] != null ? depths[1].id : depths[1]), depth0))
    + "\" data-type=\""
    + alias2(alias1((depths[1] != null ? depths[1].type : depths[1]), depth0))
    + "\" data-id=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":65,"column":105},"end":{"line":65,"column":111}}}) : helper)))
    + "\" id=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":65,"column":117},"end":{"line":65,"column":123}}}) : helper)))
    + "\" "
    + alias2((helpers["h-checked"]||(depth0 && depth0["h-checked"])||alias4).call(alias3,depth0,depths[1],{"name":"h-checked","hash":{},"data":data,"loc":{"start":{"line":65,"column":125},"end":{"line":65,"column":152}}}))
    + "/>\n            <label for=\""
    + alias2(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":66,"column":24},"end":{"line":66,"column":30}}}) : helper)))
    + "\">\n                <span></span>\n\n                <div class=\"control-desc\">"
    + alias2(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias4),(typeof helper === alias5 ? helper.call(alias3,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":69,"column":42},"end":{"line":69,"column":50}}}) : helper)))
    + "</div>\n            </label>\n        </div>\n";
},"17":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <div class=\"control-desc\">"
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data,"loc":{"start":{"line":78,"column":30},"end":{"line":78,"column":38}}}) : helper)))
    + "</div>\n    <div class=\"control-wrapper\">\n        <input data-type="
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":80,"column":25},"end":{"line":80,"column":33}}}) : helper)))
    + " data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":80,"column":42},"end":{"line":80,"column":48}}}) : helper)))
    + " type=\"text\" value=\""
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data,"loc":{"start":{"line":80,"column":68},"end":{"line":80,"column":77}}}) : helper)))
    + "\">\n    </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.show : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":84,"column":7}}})) != null ? stack1 : "");
},"useData":true,"useDepths":true});
this["Handlebars"]["templates"]["game"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"stream-info\">\n        "
    + container.escapeExpression((helpers["h-num-format"]||(depth0 && depth0["h-num-format"])||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.viewers : depth0),{"name":"h-num-format","hash":{},"data":data,"loc":{"start":{"line":10,"column":8},"end":{"line":10,"column":32}}}))
    + " __MSG_m45__\n    </span>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"stream-info\">\n        "
    + container.escapeExpression((helpers["h-num-format"]||(depth0 && depth0["h-num-format"])||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.channels : depth0),{"name":"h-num-format","hash":{},"data":data,"loc":{"start":{"line":15,"column":8},"end":{"line":15,"column":33}}}))
    + " __MSG_m46__\n    </span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, alias4="function";

  return "<div class=\"stream game-list-item js-filterable\" data-route=\"browse/"
    + alias3((helpers["h-enc"]||(depth0 && depth0["h-enc"])||alias2).call(alias1,(depth0 != null ? depth0.name : depth0),{"name":"h-enc","hash":{},"data":data,"loc":{"start":{"line":1,"column":68},"end":{"line":1,"column":82}}}))
    + "/streams\">\n    <div class=\"item-image-container game-preview\">\n        <img alt=\"\" class=\"lazy\" src=\""
    + alias3(((helper = (helper = helpers.box_art_url || (depth0 != null ? depth0.box_art_url : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"box_art_url","hash":{},"data":data,"loc":{"start":{"line":3,"column":38},"end":{"line":3,"column":53}}}) : helper)))
    + "\" />\n    </div>\n    <span title=\""
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":5,"column":17},"end":{"line":5,"column":25}}}) : helper)))
    + "\" class=\"stream-info stream-title\">\n        "
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":6,"column":16}}}) : helper)))
    + "\n    </span>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.viewers : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.channels : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":4},"end":{"line":17,"column":11}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});
this["Handlebars"]["templates"]["gameextended"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "<span class=\"stream-info\">\n    "
    + container.escapeExpression((helpers["h-num-format"]||(depth0 && depth0["h-num-format"])||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.viewers : depth0),{"name":"h-num-format","hash":{},"data":data,"loc":{"start":{"line":13,"column":4},"end":{"line":13,"column":28}}}))
    + " __MSG_m45__\n</span>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "<span class=\"stream-info\">\n    "
    + container.escapeExpression((helpers["h-num-format"]||(depth0 && depth0["h-num-format"])||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.channels : depth0),{"name":"h-num-format","hash":{},"data":data,"loc":{"start":{"line":18,"column":4},"end":{"line":18,"column":29}}}))
    + " __MSG_m46__\n</span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"item-image-container game-preview\">\n    <img src=\""
    + alias4(((helper = (helper = helpers.box_art_url || (depth0 != null ? depth0.box_art_url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"box_art_url","hash":{},"data":data,"loc":{"start":{"line":2,"column":14},"end":{"line":2,"column":29}}}) : helper)))
    + "\" alt=\"\" />\n    <!--<span class=\"game-follow\">-->\n    <!--<img src=\"../img/heart.svg\" alt=\"\"/>-->\n    <!--<img class=\"twin\" src=\"../img/heart.svg\" alt=\"\"/>-->\n    <!--</span>-->\n</div>\n<span class=\"stream-info stream-title\">\n    "
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":9,"column":4},"end":{"line":9,"column":12}}}) : helper)))
    + "\n</span>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.viewers : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":0},"end":{"line":15,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.channels : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":0},"end":{"line":20,"column":7}}})) != null ? stack1 : "")
    + "<span class=\"buttons\">\n    <span class=\"button active\" data-route=\"browse/"
    + alias4((helpers["h-enc"]||(depth0 && depth0["h-enc"])||alias2).call(alias1,((stack1 = (depth0 != null ? depth0.game : depth0)) != null ? stack1.name : stack1),{"name":"h-enc","hash":{},"data":data,"loc":{"start":{"line":22,"column":51},"end":{"line":22,"column":70}}}))
    + "/streams\">\n        <i class=\"icon icon-camera\"></i>\n        <span>__MSG_m89__</span>\n        <div class=\"indicator\"></div>\n    </span>\n    <!-- <span class=\"button\" data-route=\"browse/"
    + alias4((helpers["h-enc"]||(depth0 && depth0["h-enc"])||alias2).call(alias1,((stack1 = (depth0 != null ? depth0.game : depth0)) != null ? stack1.name : stack1),{"name":"h-enc","hash":{},"data":data,"loc":{"start":{"line":27,"column":49},"end":{"line":27,"column":68}}}))
    + "/videos\">\n        <i class=\"icon icon-play\"></i>\n        <span>__MSG_m21__</span>\n        <div class=\"indicator\"></div>\n    </span> -->\n</span>\n";
},"useData":true});
this["Handlebars"]["templates"]["screenmessage"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <h2>"
    + container.escapeExpression(((helper = (helper = helpers.header || (depth0 != null ? depth0.header : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"header","hash":{},"data":data,"loc":{"start":{"line":3,"column":8},"end":{"line":3,"column":18}}}) : helper)))
    + "</h2>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a class=\"button screen-msg-btn \" href=\"#\">"
    + container.escapeExpression(((helper = (helper = helpers.button || (depth0 != null ? depth0.button : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"button","hash":{},"data":data,"loc":{"start":{"line":9,"column":47},"end":{"line":9,"column":57}}}) : helper)))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<div class=\"screen-msg\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.header : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":4,"column":11}}})) != null ? stack1 : "")
    + "    <p>\n        "
    + container.escapeExpression(((helper = (helper = helpers.text || (depth0 != null ? depth0.text : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"text","hash":{},"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":6,"column":16}}}) : helper)))
    + "\n    </p>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.button : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + "</div>";
},"useData":true});
this["Handlebars"]["templates"]["stream"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"stream-uptime\">\n            "
    + container.escapeExpression((helpers["h-uptime"]||(depth0 && depth0["h-uptime"])||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.started_at : depth0),{"name":"h-uptime","hash":{},"data":data,"loc":{"start":{"line":5,"column":12},"end":{"line":5,"column":35}}}))
    + "\n        </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "        <span class=\"icon-vodcast\" title=\"vodcast\"></span>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"stream js-filterable\">\n    <div class=\"item-image-container stream-preview\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.favorite : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":8},"end":{"line":7,"column":15}}})) != null ? stack1 : "")
    + "        <img class=\"lazy\" alt=\"\" data-original=\""
    + alias4(((helper = (helper = helpers.thumbnail_url || (depth0 != null ? depth0.thumbnail_url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"thumbnail_url","hash":{},"data":data,"loc":{"start":{"line":8,"column":48},"end":{"line":8,"column":65}}}) : helper)))
    + "\"/>\n    </div>\n    <span class=\"stream-info stream-title\">\n            "
    + alias4(((helper = (helper = helpers.user_name || (depth0 != null ? depth0.user_name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"user_name","hash":{},"data":data,"loc":{"start":{"line":11,"column":12},"end":{"line":11,"column":25}}}) : helper)))
    + "\n    </span>\n    <span class=\"stream-info stream-info-viewers\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.vodcast : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":8},"end":{"line":16,"column":15}}})) != null ? stack1 : "")
    + "            "
    + alias4(((helper = (helper = helpers.game_name || (depth0 != null ? depth0.game_name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"game_name","hash":{},"data":data,"loc":{"start":{"line":17,"column":12},"end":{"line":17,"column":25}}}) : helper)))
    + " - "
    + alias4((helpers["h-num-format"]||(depth0 && depth0["h-num-format"])||alias2).call(alias1,(depth0 != null ? depth0.viewer_count : depth0),{"name":"h-num-format","hash":{},"data":data,"loc":{"start":{"line":17,"column":28},"end":{"line":17,"column":57}}}))
    + " __MSG_m45__\n        </span>\n    <span class=\"stream-info stream-info-status\" title=\""
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":19,"column":56},"end":{"line":19,"column":65}}}) : helper)))
    + " \">\n            "
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":20,"column":12},"end":{"line":20,"column":21}}}) : helper)))
    + "\n        </span>\n</div>\n";
},"useData":true});
this["Handlebars"]["templates"]["user"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"user-panel\">\n\n    <div class=\"dropdown\">\n        <div class=\"username dropdown-toggle\" type=\"button\" id=\"dropdownMenu2\" data-toggle=\"dropdown\" aria-expanded=\"true\">\n            <img class=\"lazy\" alt=\"\" src=\""
    + alias4(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"logo","hash":{},"data":data,"loc":{"start":{"line":6,"column":42},"end":{"line":6,"column":50}}}) : helper)))
    + "\"/>\n            "
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data,"loc":{"start":{"line":7,"column":12},"end":{"line":7,"column":20}}}) : helper)))
    + "\n            <i class=\"icon-menu\"></i>\n        </div>\n\n        <ul class=\"dropdown-menu dropdown-menu-right\" role=\"menu\" aria-labelledby=\"dropdownMenu2\">\n            <li role=\"presentation\">\n                <a role=\"menuitem\"\n                   tabindex=\"-1\" href=\"#user/notifications\">__MSG_m85__</a>\n            </li>\n            <li class=\"divider\"></li>\n            <li role=\"presentation\">\n                <a role=\"menuitem\" id=\"logout-btn\" tabindex=\"-1\"\n                   href=\"#\">__MSG_m53__</a>\n            </li>\n        </ul>\n    </div>\n\n</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "<a class=\"btn\" title=\"__MSG_m52__\" id=\"login-btn\">__MSG_m52__</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.authenticated : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":27,"column":7}}})) != null ? stack1 : "");
},"useData":true});
this["Handlebars"]["templates"]["video"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda;

  return "<div class=\"stream js-tab js-filterable\" data-href=\""
    + alias4(((helper = (helper = helpers.url || (depth0 != null ? depth0.url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"url","hash":{},"data":data,"loc":{"start":{"line":1,"column":52},"end":{"line":1,"column":59}}}) : helper)))
    + "\">\n    <div class=\"item-image-container stream-preview\">\n        <img alt=\"\" class=\"lazy\" data-original=\""
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.preview : depth0)) != null ? stack1.medium : stack1), depth0))
    + "\"/>\n        <div class=\"stream-uptime\">\n            "
    + alias4((helpers["h-date-format"]||(depth0 && depth0["h-date-format"])||alias2).call(alias1,(depth0 != null ? depth0.length : depth0),{"name":"h-date-format","hash":{},"data":data,"loc":{"start":{"line":5,"column":12},"end":{"line":5,"column":36}}}))
    + "\n        </div>\n    </div>\n    <span class=\"stream-info stream-title\" title=\""
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":8,"column":50},"end":{"line":8,"column":59}}}) : helper)))
    + "\">\n            "
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":9,"column":12},"end":{"line":9,"column":21}}}) : helper)))
    + "\n    </span>\n\n    <span class=\"stream-info\">\n            "
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.channel : depth0)) != null ? stack1.display_name : stack1), depth0))
    + " - "
    + alias4(((helper = (helper = helpers.game || (depth0 != null ? depth0.game : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"game","hash":{},"data":data,"loc":{"start":{"line":13,"column":39},"end":{"line":13,"column":47}}}) : helper)))
    + "\n    </span>\n\n    <span class=\"stream-info\">\n        "
    + alias4((helpers["h-prettydate"]||(depth0 && depth0["h-prettydate"])||alias2).call(alias1,(depth0 != null ? depth0.recorded_at : depth0),{"name":"h-prettydate","hash":{},"data":data,"loc":{"start":{"line":17,"column":8},"end":{"line":17,"column":36}}}))
    + "\n    </span>\n</div>";
},"useData":true});