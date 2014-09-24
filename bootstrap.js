"use strict";

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

function FrameOptionsDefeater() {
  Services.obs.addObserver(this, 'xpcom-shutdown', true);
  this._registerHttpObservers();
}
FrameOptionsDefeater.prototype = {
  QueryInterface: XPCOMUtils.generateQI(
      [Ci.nsIObserver, Ci.nsISupportsWeakReference, Ci.nsIWeakReference]),
  QueryReferent: function(iid) this.QueryInterface(iid),
  GetWeakReference: function() this,

  _registerHttpObservers: function _registerHttpObservers() {
    Services.obs.addObserver(this, 'http-on-modify-request', true);
    Services.obs.addObserver(this, 'http-on-examine-response', true);
    Services.obs.addObserver(this, 'http-on-examine-cached-response', true);
  },

  _unregisterHttpObservers: function _unregisterHttpObservers() {
    Services.obs.removeObserver(this, 'http-on-modify-request');
    Services.obs.removeObserver(this, 'http-on-examine-response');
    Services.obs.removeObserver(this, 'http-on-examine-cached-response');
  },

  shutdown: function() {
    this._unregisterHttpObservers();
    Services.obs.removeObserver(this, 'xpcom-shutdown');
  },

  observe: function observe(subject, topic, data) {
    switch(topic) {
    case 'xpcom-shutdown':
      this.shutdown();
      break;
    case 'http-on-modify-request':
      this.observeRequest(subject, topic, data);
      break;
    case 'http-on-examine-response':
    case 'http-on-examine-cached-response':
      this.observeResponse(subject, topic, data);
      break;
    }
  },

  observeRequest: function observeRequest(channel, topic, data) {
  },

  observeResponse: function observeResponse(channel, topic, data) {
    if (this.channelIsLoadForNewsblur(channel)) {
      channel.setResponseHeader(
          'X-Frame-Options', 'ALLOW-FROM https://www.newsblur.com/', false);
      channel.setResponseHeader(
          'X-Frame-Options', 'ALLOW-FROM https://newsblur.com/', false);
    }
  },

  channelIsLoadForNewsblur: function(channel) {
    try {
      channel.QueryInterface(Ci.nsIHttpChannel);
      var win = channel.notificationCallbacks
          .getInterface(Ci.nsILoadContext)
          .associatedWindow;
      var th = win.top.location.host;
    } catch (e) {
      // If I couldn't look it up for sure, default to no.
      return false;
    }

    // But when I can look it up, check for both host name options.
    return (th && th in {'newsblur.com': 1, 'www.newsblur.com': 1});
  }
};

var frameOptionsDefeater = null;
function startup() {
  frameOptionsDefeater = new FrameOptionsDefeater();
}
function shutdown() {
  frameOptionsDefeater && frameOptionsDefeater.shutdown();
}
function install() { }
function uninstall() { }
