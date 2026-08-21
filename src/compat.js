/*
 * 星海工坊 · 兼容层 (compat.js)
 * ============================================================================
 * 职责：集中处理独立扩展运行环境下的“环境发现”与 iframe / same-origin 异常。
 *
 * 它需要安全解析这些宿主对象，且不能假设它们在扩展加载的第一毫秒就存在：
 *   - window
 *   - window.parent
 *   - window.top
 *   - SillyTavern
 *   - TavernHelper
 *   - Mvu
 *   - document
 *
 * 设计约束：
 *   - 所有跨 window 访问都用 try/catch 包裹，跨域（same-origin）访问抛错时静默降级。
 *   - 只提供有界、低频的 waitFor 轮询（默认 200ms 一次、5s 超时），绝不无限高频轮询。
 *   - 不依赖任何第三方框架，全部原生 JS。
 * ============================================================================
 */
(function () {
  'use strict';

  function safeGet(fn) {
    try { return fn(); } catch (e) { return null; }
  }

  function parentWindow() {
    return safeGet(function () {
      return (window.parent && window.parent !== window) ? window.parent : null;
    });
  }

  function topWindow() {
    return safeGet(function () {
      return (window.top && window.top !== window) ? window.top : null;
    });
  }

  // 有界向上寻找“最高仍可安全访问同源 document 的 ancestor window”。
  // 若扩展运行在嵌套同源 iframe 中，overlay 必须挂到最顶层同源 document；
  // 否则即使 overlay 是 position:fixed + inset:0，也只能覆盖中间容器的 viewport，
  // 导致宿主页面底部/边缘漏出白条。最多上探 8 层；跨域（document 不可读）立即安全停止；绝不无限循环。
  function highestSameOriginWindow() {
    var current = (typeof window !== 'undefined') ? window : null;
    if (!current) return null;
    var best = current;
    for (var i = 0; i < 8; i++) {
      var parent = safeGet(function () {
        return (current.parent && current.parent !== current) ? current.parent : null;
      });
      if (!parent) break;
      var usable = safeGet(function () {
        return !!(
          parent.document &&
          parent.document.documentElement &&
          parent.document.body
        );
      });
      if (!usable) break;
      best = parent;
      current = parent;
    }
    return best;
  }

  // 宿主窗口：最高可安全访问的同源 ancestor window。
  // 修复：原实现只上探一层 parent，若扩展运行在中间同源 iframe，
  // hostDocument 会返回中间 document，导致 overlay 无法覆盖 SillyTavern 顶层 viewport。
  function hostWindow() {
    return highestSameOriginWindow();
  }

  function hostDocument() {
    var w = hostWindow();
    if (w) {
      var d = safeGet(function () { return (w.document && w.document.body) ? w.document : null; });
      if (d) return d;
    }
    return (typeof document !== 'undefined') ? document : null;
  }

  // 依次在 window / parent / top 上查找一个全局名字，返回第一个可安全取到的值。
  function resolveGlobal(name) {
    var cands = [];
    if (typeof window !== 'undefined') cands.push(window);
    var p = parentWindow(); if (p) cands.push(p);
    var t = topWindow(); if (t) cands.push(t);
    for (var i = 0; i < cands.length; i++) {
      var v = safeGet(function (c) { return c[name]; }.bind(null, cands[i]));
      if (v !== null && v !== undefined) return v;
    }
    return null;
  }

  function getSillyTavern() { return resolveGlobal('SillyTavern'); }
  function getTavernHelper() { return resolveGlobal('TavernHelper'); }

  function getMvu() {
    var m = resolveGlobal('Mvu');
    if (m && typeof m.getMvuData === 'function') return m;
    return null;
  }

  function getContext() {
    var st = getSillyTavern();
    return safeGet(function () {
      return (st && typeof st.getContext === 'function') ? st.getContext() : null;
    });
  }

  function isFunction(f) { return typeof f === 'function'; }

  // 有界低频轮询：predicate 返回真即 resolve(true)；超时 resolve(false)。
  // intervalMs 默认 200（5Hz），timeoutMs 默认 5000，绝不无限循环。
  function waitFor(predicate, timeoutMs, intervalMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      var limit = timeoutMs || 5000;
      var step = Math.max(120, intervalMs || 200);
      var iv = setInterval(function () {
        var ok = false;
        try { ok = !!predicate(); } catch (e) { ok = false; }
        if (ok) { clearInterval(iv); resolve(true); return; }
        if (Date.now() - t0 >= limit) { clearInterval(iv); resolve(false); }
      }, step);
    });
  }

  // 在 window / parent / top 上查找并返回工坊入口 __XYWS_OPEN__。
  function findOpen() {
    var cands = [];
    if (typeof window !== 'undefined') cands.push(window);
    var p = parentWindow(); if (p) cands.push(p);
    var t = topWindow(); if (t) cands.push(t);
    for (var i = 0; i < cands.length; i++) {
      var fn = safeGet(function (c) { return c.__XYWS_OPEN__; }.bind(null, cands[i]));
      if (typeof fn === 'function') return fn;
    }
    return null;
  }

  // 在 window / parent / top 上把工坊入口 fn 暴露出去，供状态栏按钮与开场白按钮解析。
  function exposeOpen(fn) {
    if (typeof fn !== 'function') return;
    var cands = [];
    if (typeof window !== 'undefined') cands.push(window);
    var p = parentWindow(); if (p) cands.push(p);
    var t = topWindow(); if (t) cands.push(t);
    for (var i = 0; i < cands.length; i++) {
      safeGet(function (c) { c.__XYWS_OPEN__ = fn; return true; }.bind(null, cands[i]));
    }
  }

  var COMPAT = {
    window: (typeof window !== 'undefined') ? window : null,
    parentWindow: parentWindow,
    topWindow: topWindow,
    hostWindow: hostWindow,
    hostDocument: hostDocument,
    resolveGlobal: resolveGlobal,
    getSillyTavern: getSillyTavern,
    getTavernHelper: getTavernHelper,
    getMvu: getMvu,
    getContext: getContext,
    isFunction: isFunction,
    waitFor: waitFor,
    findOpen: findOpen,
    exposeOpen: exposeOpen
  };

  try { if (typeof window !== 'undefined') window.__XYWS_COMPAT__ = COMPAT; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__XYWS_COMPAT__ = COMPAT; } catch (e) {}
})();
