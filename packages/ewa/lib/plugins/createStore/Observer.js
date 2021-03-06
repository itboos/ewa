"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var isFunction = require('lodash.isfunction');

var get = require('lodash.get');

var set = require('lodash.set');

var has = require('lodash.has');

var Observer = function () {
  function Observer() {
    _classCallCheck(this, Observer);

    this.reactiveObj = {};
    this.reactiveBus = {};
    this.eventBus = {};
    this.globalWatchers = [];
  }

  _createClass(Observer, [{
    key: "setGlobalWatcher",
    value: function setGlobalWatcher(obj) {
      if (!this.isExistSameId(this.globalWatchers, obj.id)) this.globalWatchers.push(obj);
    }
  }, {
    key: "onReactive",
    value: function onReactive(key, obj) {
      if (!this.reactiveBus[key]) this.reactiveBus[key] = [];
      if (!this.isExistSameId(this.reactiveBus[key], obj.id)) this.reactiveBus[key].push(obj);
    }
  }, {
    key: "onEvent",
    value: function onEvent(key, callback, ctx, watcherId) {
      if (!this.eventBus[key]) this.eventBus[key] = [];

      if (this.isExistSameId(this.eventBus[key], watcherId)) {
        if (console && console.warn) console.warn("\u81EA\u5B9A\u4E49\u4E8B\u4EF6 '".concat(key, "' \u65E0\u6CD5\u91CD\u590D\u6DFB\u52A0\uFF0C\u8BF7\u5C3D\u5FEB\u8C03\u6574"));
      } else {
        this.eventBus[key].push(this.toEventObj(watcherId, callback.bind(ctx)));
      }
    }
  }, {
    key: "once",
    value: function once(key, callback, watcherId) {
      var _this = this;

      var wrapFanc = function wrapFanc(args) {
        callback(args);

        _this.off(key, watcherId);
      };

      this.onEvent(key, wrapFanc, watcherId);
    }
  }, {
    key: "toEventObj",
    value: function toEventObj(id, callback) {
      return {
        id: id,
        callback: callback
      };
    }
  }, {
    key: "off",
    value: function off(key, watcherId) {
      if (!has(this.eventBus, key)) return;
      this.eventBus[key] = this.removeById(this.eventBus[key], watcherId);
      this.removeEmptyArr(this.eventBus, key);
    }
  }, {
    key: "removeReactive",
    value: function removeReactive(watcherKeys, id) {
      var _this2 = this;

      watcherKeys.forEach(function (key) {
        _this2.reactiveBus[key] = _this2.removeById(_this2.reactiveBus[key], id);

        _this2.removeEmptyArr(_this2.reactiveBus, key);
      });
    }
  }, {
    key: "removeEvent",
    value: function removeEvent(id) {
      var _this3 = this;

      var eventKeys = Object.keys(this.eventBus);
      eventKeys.forEach(function (key) {
        _this3.eventBus[key] = _this3.removeById(_this3.eventBus[key], id);

        _this3.removeEmptyArr(_this3.eventBus, key);
      });
    }
  }, {
    key: "removeWatcher",
    value: function removeWatcher(id) {
      this.globalWatchers = this.removeById(this.globalWatchers, id);
    }
  }, {
    key: "emitReactive",
    value: function emitReactive(key, value) {
      var mergeKey = key.indexOf('.') > -1 ? key.split('.')[0] : key;
      if (!has(this.reactiveBus, mergeKey)) return;
      this.reactiveBus[mergeKey].forEach(function (obj) {
        if (isFunction(obj.update)) obj.update(key, value);
      });
    }
  }, {
    key: "emitEvent",
    value: function emitEvent(key, value) {
      if (!has(this.eventBus, key)) return;
      this.eventBus[key].forEach(function (obj) {
        if (isFunction(obj.callback)) obj.callback(value);
      });
    }
  }, {
    key: "handleUpdate",
    value: function handleUpdate(key, value) {
      if (has(this.reactiveObj, key)) {
        if (get(this.reactiveObj, key) !== value) {
          set(this.reactiveObj, key, value);
        } else {
          this.emitReactive(key, value);
        }
      } else {
        this.globalWatchers.forEach(function (watcher) {
          if (has(watcher.$data, key)) {
            watcher.update(key, value);
          }
        });
      }
    }
  }, {
    key: "isExistSameId",
    value: function isExistSameId(arr, id) {
      if (Array.isArray(arr) && arr.length) {
        return arr.findIndex(function (item) {
          return item.id === id;
        }) > -1;
      }

      return false;
    }
  }, {
    key: "removeById",
    value: function removeById(arr, id) {
      if (Array.isArray(arr) && arr.length) {
        return arr.filter(function (item) {
          return item.id !== id;
        });
      }

      return arr;
    }
  }, {
    key: "removeEmptyArr",
    value: function removeEmptyArr(obj, key) {
      if (!obj || !Array.isArray(obj[key])) return;
      if (obj[key].length === 0) delete obj[key];
    }
  }], [{
    key: "getInstance",
    value: function getInstance() {
      if (!this.instance) {
        this.instance = new Observer();
      }

      return this.instance;
    }
  }]);

  return Observer;
}();

module.exports = Observer;