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
    try {
      channel.QueryInterface(Ci.nsIHttpChannel);
    } catch (e) {
      return;
    }
    if (channel.referrer && 'newsblur.com' == channel.referrer.host) {
      channel.setResponseHeader(
          'X-Frame-Options', 'ALLOW-FROM https://newsblur.com/', false);
    }
    if (channel.referrer && 'www.newsblur.com' == channel.referrer.host) {
      channel.setResponseHeader(
          'X-Frame-Options', 'ALLOW-FROM https://www.newsblur.com/', false);
    }
  },

  shutdown: function() {
    this._unregisterHttpObservers();
    Services.obs.removeObserver(this, 'xpcom-shutdown');
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
