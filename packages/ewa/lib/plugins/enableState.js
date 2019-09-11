/* eslint-disable no-console */

const diff = require('deep-diff');
const set = require('lodash.set');
const get = require('lodash.get');
const cloneDeep = require('lodash.clonedeep');
const pick = require('lodash.pick');
const keys = require('lodash.keys');

const noop = function(){};

// 日志打印
const logger = function(type, name, timeConsumption = 0, changes) {
  if (!console) return;
  let timeConsumptionMsg = `Diff 耗时: ${timeConsumption}ms`;
  try {
    if (console.group) {
      console.group(type, name);
      console.log(timeConsumptionMsg);
      console.log(changes);
      console.groupEnd();
    } else {
      console.log(type, name, timeConsumptionMsg, changes);
    }
  } catch (e) {
    // Do nothing
  }
};

// 开启 state 支持
function enableState(opts = {}) {
  const {
    // 是否开启 debug 模式，支持3种参数： true, 'page', 'component'
    debug = false,

    // 是否开启 component 支持
    component = true,

    // 是否开启 page 支持
    page = true,

    // 数组删除操作： true 或者 false
    overwriteArrayOnDeleted = true,

    // 是否在 调用 setData 时自动同步 state
    autoSync = true
  } = opts;

  // 解析变更内容
  function diffAndMergeChanges(state, obj) {
    let rawChanges = diff(pick(state, keys(obj)), obj);

    if (!rawChanges) return;

    let changes = {};
    let lastArrayDeletedPath = '';
    let hasChanges = false;

    for (let i = 0; i < rawChanges.length; i++) {
      let item = rawChanges[i];
      // NOTE: 暂不处理删除对象属性的情况
      if (item.kind !== 'D') {
        // 修复路径 a.b.0.1 => a.b[0][1]
        let path = item.path
          .join('.')
          .replace(/\.([0-9]+)\./g, '[$1].')
          .replace(/\.([0-9]+)$/, '[$1]');

        // 处理数组删除的问题，后续更新如果为数组中的元素，直接跳过
        if (
          overwriteArrayOnDeleted &&
          lastArrayDeletedPath &&
          path.indexOf(lastArrayDeletedPath) === 0
        ) continue;

        // 记录变化
        let value = item.rhs;

        // 对数组特殊处理
        if (item.kind === 'A') {
          // 处理数组元素删除的情况，需要业务代码做支持
          if (item.item.kind === 'D') {
            // 覆盖整个数组
            if (overwriteArrayOnDeleted) {
              // 如果后续变更依然为同一个数组中的操作，直接跳过
              if (lastArrayDeletedPath === path) continue;

              lastArrayDeletedPath = path;
              value = get(obj, path);
            }

            // 对特定数组元素置空
            else {
              path = `${path}[${item.index}]`;
              value = null;
            }
          }
          // 其他情况如 添加/修改 直接修改值
          else {
            // 如果后续变更为数组中的更新，忽略
            if (overwriteArrayOnDeleted && lastArrayDeletedPath === path) continue;

            path = `${path}[${item.index}]`;
            value = item.item.rhs;
          }
        }

        // 忽略 undefined
        if (value !== void 0) {
          hasChanges = true;
          set(state, path, value);

          // 深拷贝 value，防止对 this.data 的直接修改影响 diff 算法的结果
          changes[path] = cloneDeep(value);
        }
      }
    }

    return hasChanges ? changes : null;
  }

  // 初始化状态函数
  function initState() {
    // 初始化状态
    this.$$state = cloneDeep(this.data);
  }

  // 给 setData 打补丁,
  function patchSetData() {
    this.__setData = this.setData;

    this.setData = (obj, callback) => {
      this.__setData(obj, function() {
        // 如果开启自动同步，则在调用 setData 完成后，自动同步所有数据到 state 中
        if (autoSync) initState.call(this);
        if (typeof callback === 'function') return callback();
      });
    };
  }

  // 设置状态函数
  function setState(obj, callback) {
    // 初始化状态
    if (!this.$$state) this.initState();

    // 计算增量更新
    let time;
    if (debug) time = +new Date();

    // 计算变更
    let changes = diffAndMergeChanges(this.$$state, obj);

    // 如果有变更，则触发更新
    if (changes) {
      // 开启调试模式
      if (debug) {
        let timeConsumption = +new Date() - time;
        let type = this.__isPage ? 'Page:' : 'Component:';
        if (debug === true) logger(type, this.route || this.is, timeConsumption, changes);
        if (debug === 'page' && this.__isPage) logger(type, this.route, timeConsumption, changes);
        if (debug === 'component' && this.__isComponent) logger(type, this.is, timeConsumption, changes);
      }

      this.__setData(changes, callback);
    } else {
      if (typeof callback === 'function') callback();
    }
  }

  // 仅在 Page 开启 setState
  if (page) {
    const $Page = Page;
    Page = function(obj = {}) {
      obj.__isPage = true;

      // 修改 onLoad 方法，页面载入时打补丁
      let _onLoad = obj.onLoad || noop;
      obj.onLoad = function() {
        initState.call(this);
        patchSetData.call(this);
        return _onLoad.apply(this, arguments);
      };

      // 注入 initState 和 setState 方法
      obj.initState = function() { initState.call(this); };
      obj.setState = function() { setState.apply(this, arguments); };

      return $Page(obj);
    };
  }

  // 仅在 Component 开启 setState
  if (component) {
    const $Component = Component;
    Component = function(obj = {}) {
      obj.lifetimes = obj.lifetimes || {};
      obj.methods = obj.methods || {};

      // 修改 created 方法，组件创建时打补丁
      let _created = obj.lifetimes.created || obj.created || noop;
      obj.lifetimes.created = obj.created = function() {
        patchSetData.call(this);
        this.__isComponent = true;
        return _created.apply(this, arguments);
      };

      // 修改 attached 方法，组件挂载时初始化 state
      let _attached = obj.lifetimes.attached || obj.attached || noop;
      obj.lifetimes.attached = obj.attached = function() {
        initState.call(this);
        return _attached.apply(this, arguments);
      };

      // 注入 initState 和 setState 方法
      obj.methods.initState = function() { initState.call(this); };
      obj.methods.setState = function() { setState.apply(this, arguments); };

      return $Component(obj);
    };
  }
}

module.exports = enableState;