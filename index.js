import './src/compat.js';
import './src/cloud-config.js';
import './src/auth.js';
import './src/cloud.js';
import './src/cloud-write.js';
import './src/cloud-manage.js';
import './src/workshop.js';

/*
 * 星海工坊 · 扩展入口 (index.js)
 * ============================================================================
 * 职责：
 *   1. 通过兼容层发现宿主 document / window；
 *   2. 调用 workshop 模块的 install()，把工坊 UI 挂到 SillyTavern 主页面；
 *   3. 把入口 __XYWS_OPEN__ 暴露到 window / parent / top，使状态栏按钮与
 *      开场白「进入星海工坊」按钮都能解析到工坊入口。
 *
 * 不做任何网络 / 账号 / 服务器相关工作。
 * ============================================================================
 */
(function () {
  'use strict';

  function compat() {
    if (typeof window !== 'undefined' && window.__XYWS_COMPAT__) return window.__XYWS_COMPAT__;
    try { if (typeof globalThis !== 'undefined' && globalThis.__XYWS_COMPAT__) return globalThis.__XYWS_COMPAT__; } catch (e) {}
    return null;
  }

  function workshop() {
    if (typeof window !== 'undefined' && window.__XYWS_WORKSHOP__) return window.__XYWS_WORKSHOP__;
    try { if (typeof globalThis !== 'undefined' && globalThis.__XYWS_WORKSHOP__) return globalThis.__XYWS_WORKSHOP__; } catch (e) {}
    return null;
  }

  var booted = false;

  function boot() {
    if (booted) return true;
    var C = compat();
    var WS = workshop();
    if (!C || !WS || typeof WS.install !== 'function') return false;

    var doc = C.hostDocument();
    var win = C.hostWindow();
    if (!doc || !win) return false;

    var ok = true;
    try {
      WS.install(doc, win, 'xysb-workshop');
    } catch (e) {
      ok = false;
      try { if (typeof console !== 'undefined') console.error('[星海工坊] 初始化失败', e); } catch (_) {}
    }

    if (ok) {
      // install() 内部已把 open 写到宿主窗口；这里再确保 window / parent / top 都能解析。
      var fn = null;
      try { fn = C.findOpen(); } catch (e) {}
      if (!fn) { try { fn = win.__XYWS_OPEN__; } catch (e) {} }
      C.exposeOpen(fn);
      booted = true;
    }
    return ok;
  }

  var tries = 0;
  var MAX_TRIES = 40;   // 250ms * 40 ≈ 10s，有界低频，绝不无限轮询
  function attempt() {
    if (boot()) return;
    if (++tries < MAX_TRIES) setTimeout(attempt, 250);
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attempt, { once: true });
  } else {
    attempt();
  }
})();
