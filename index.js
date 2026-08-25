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
 * 工坊业务不在这里发起网络请求；仅为酒馆“扩展程序”外层设置卡片调用 SillyTavern 自己的扩展版本/更新接口。
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


  var XYWS_EXT_VERSION = '2.0.0-dev.31.3';
  var settingsMounted = false;

  async function xywsRequestHeaders() {
    try {
      var mod = await import('/script.js');
      if (mod && typeof mod.getRequestHeaders === 'function') return mod.getRequestHeaders();
    } catch (e) {}
    return { 'Content-Type': 'application/json' };
  }

  async function xywsFindInstall() {
    try {
      var res = await fetch('/api/extensions/discover');
      if (!res.ok) return null;
      var list = await res.json();
      var hit = Array.isArray(list) ? list.find(function (x) {
        var n = String(x && x.name || '');
        return n === 'starsea-workshop' || n === '/starsea-workshop' || /(?:^|\/)starsea-workshop$/.test(n);
      }) : null;
      if (!hit) return null;
      var name = String(hit.name || 'starsea-workshop');
      if (name.indexOf('third-party') === 0) name = name.replace('third-party', '');
      return { extensionName: name, global: String(hit.type || '') === 'global' };
    } catch (e) { return null; }
  }

  async function xywsCheckUpdate(panel, quiet) {
    var status = panel && panel.querySelector('[data-xyws-ext-status]');
    var badge = panel && panel.querySelector('[data-xyws-update-badge]');
    var updateBtn = panel && panel.querySelector('[data-xyws-update]');
    if (!panel) return false;
    if (!quiet && status) status.textContent = '正在检查 GitHub 更新…';
    try {
      var install = await xywsFindInstall();
      if (!install) {
        if (status) status.textContent = '当前不是酒馆可识别的 Git 安装；请从 GitHub URL 安装一次。';
        return false;
      }
      var headers = await xywsRequestHeaders();
      var res = await fetch('/api/extensions/version', { method: 'POST', headers: headers, body: JSON.stringify(install) });
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      var data = await res.json();
      var hasUpdate = data && data.isUpToDate === false;
      if (badge) badge.hidden = !hasUpdate;
      if (updateBtn) updateBtn.hidden = !hasUpdate;
      if (status) status.textContent = hasUpdate ? '发现新版本，点“更新星海工坊”即可。' : ('已是最新 · '+String(data.currentBranchName||'main')+'-'+String(data.currentCommitHash||'').slice(0,7));
      return hasUpdate;
    } catch (e) {
      if (!quiet && status) status.textContent = '检查更新失败：'+(e && e.message ? e.message : String(e));
      return false;
    }
  }

  async function xywsDoUpdate(panel) {
    var btn = panel && panel.querySelector('[data-xyws-update]');
    var status = panel && panel.querySelector('[data-xyws-ext-status]');
    if (!panel) return;
    if (btn) { btn.disabled = true; btn.textContent = '更新中…'; }
    try {
      var install = await xywsFindInstall();
      if (!install) throw new Error('没有找到 Git 安装记录');
      var headers = await xywsRequestHeaders();
      var res = await fetch('/api/extensions/update', { method: 'POST', headers: headers, body: JSON.stringify(install) });
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      var data = await res.json();
      if (status) status.textContent = data && data.isUpToDate ? '已经是最新版本。' : '更新完成，正在刷新页面…';
      if (data && !data.isUpToDate) setTimeout(function(){ try { location.reload(); } catch(e){} }, 700);
      else await xywsCheckUpdate(panel, false);
    } catch (e) {
      if (status) status.textContent = '更新失败：'+(e && e.message ? e.message : String(e));
    } finally {
      if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = '更新星海工坊'; }
    }
  }

  function mountSettingsPanel() {
    if (settingsMounted) return true;
    var C = compat();
    var doc = C && C.hostDocument ? C.hostDocument() : (typeof document !== 'undefined' ? document : null);
    if (!doc) return false;
    var host = doc.querySelector('#extensions_settings2') || doc.querySelector('#extensions_settings');
    if (!host) return false;
    var old = doc.getElementById('xyws-extension-settings');
    if (old) { settingsMounted = true; return true; }
    var panel = doc.createElement('div');
    panel.id = 'xyws-extension-settings';
    panel.innerHTML = '<div class="inline-drawer"><div class="inline-drawer-toggle inline-drawer-header"><b>星海工坊 <span class="xyws-ext-version">'+XYWS_EXT_VERSION+'</span> <span class="xyws-update-badge" data-xyws-update-badge hidden>有更新</span></b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div><div class="inline-drawer-content"><div class="xyws-ext-actions"><button type="button" class="menu_button" data-xyws-open>打开星海工坊</button><button type="button" class="menu_button" data-xyws-check>检查更新</button><button type="button" class="menu_button xyws-ext-update" data-xyws-update hidden>更新星海工坊</button></div><small class="xyws-ext-status" data-xyws-ext-status>正在读取版本状态…</small></div></div>';
    host.appendChild(panel);
    var openBtn = panel.querySelector('[data-xyws-open]');
    var checkBtn = panel.querySelector('[data-xyws-check]');
    var updateBtn = panel.querySelector('[data-xyws-update]');
    if (openBtn) openBtn.addEventListener('click', function(){ var C2=compat(),fn=C2&&C2.findOpen?C2.findOpen():null;if(typeof fn==='function')fn(); });
    if (checkBtn) checkBtn.addEventListener('click', function(){ xywsCheckUpdate(panel, false); });
    if (updateBtn) updateBtn.addEventListener('click', function(){ xywsDoUpdate(panel); });
    settingsMounted = true;
    setTimeout(function(){ xywsCheckUpdate(panel, true); }, 500);
    // 页面长期打开时也能看到新版本提示；半小时轻量检查一次。
    try {
      panel.__xywsUpdateTimer = setInterval(function(){
        if (!panel.isConnected) { clearInterval(panel.__xywsUpdateTimer); return; }
        xywsCheckUpdate(panel, true);
      }, 30 * 60 * 1000);
    } catch (e) {}
    return true;
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
  var MAX_TRIES = 80;   // 最多约 20s，等待宿主扩展设置区与聊天 UI 完成挂载
  function attempt() {
    var okBoot = boot();
    var okPanel = mountSettingsPanel();
    if (okBoot && okPanel) return;
    if (++tries < MAX_TRIES) setTimeout(attempt, 250);
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attempt, { once: true });
  } else {
    attempt();
  }
})();
